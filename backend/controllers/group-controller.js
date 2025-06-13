const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class GroupController {
  /**
   * 그룹 목록 조회
   * GET /groups
   */
  static async getGroups(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'latest',
        search,
      } = req.query;

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const offset = (pageNum - 1) * limitNum;

      // 입력값 검증
      if (pageNum < 1 || limitNum < 1) {
        const error = new Error('페이지와 limit은 1 이상이어야 합니다.');
        error.status = 400;
        throw error;
      }

      // 검색 조건
      const whereCondition = search
        ? {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          }
        : {};

      // 전체 개수 조회
      const totalCount = await prisma.group.count({
        where: whereCondition,
      });

      let groups;

      // recommend 또는 participants로 정렬하는 경우
      if (sort === 'recommend' || sort === 'participants') {
        // 모든 그룹을 조회 (검색 조건 적용)
        const allGroups = await prisma.group.findMany({
          where: whereCondition,
          select: {
            id: true,
            name: true,
            photoUrl: true,
            badge: true,
            goalRep: true,
            createdAt: true,
            owner: {
              select: {
                id: true,
                nickname: true,
              },
            },
            tag: {
              select: {
                name: true,
              },
            },
            _count: {
              select: {
                participants: true,
                groupRecommend: true,
              },
            },
          },
        });

        // 메모리에서 정렬
        allGroups.sort((a, b) => {
          if (sort === 'recommend') {
            return b._count.groupRecommend - a._count.groupRecommend;
          } else {
            return b._count.participants - a._count.participants;
          }
        });

        // 페이지네이션 적용
        groups = allGroups.slice(offset, offset + limitNum);
      } else {
        // latest 정렬 (기본)
        groups = await prisma.group.findMany({
          where: whereCondition,
          orderBy: [
            {
              createdAt: 'desc',
            },
          ],
          skip: offset,
          take: limitNum,
          select: {
            id: true,
            name: true,
            photoUrl: true,
            badge: true,
            goalRep: true,
            createdAt: true,
            owner: {
              select: {
                id: true,
                nickname: true,
              },
            },
            tag: {
              select: {
                name: true,
              },
            },
            _count: {
              select: {
                participants: true,
                groupRecommend: true,
              },
            },
          },
        });
      }

      // 응답 데이터 가공
      const groupList = groups.map((group) => ({
        id: group.id,
        name: group.name,
        nickname: group.owner.nickname,
        photoUrl: group.photoUrl,
        badge: group.badge,
        tags: group.tag.map((t) => t.name),
        goalRep: group.goalRep,
        recommendCount: group._count.groupRecommend,
        participantCount: group._count.participants,
        createdAt: group.createdAt,
      }));

      // 페이지네이션 정보
      const totalPages = Math.ceil(totalCount / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;

      res.status(200).json({
        success: true,
        data: {
          groups: groupList,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalCount,
            hasNextPage,
            hasPrevPage,
            limit: limitNum,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 그룹 상세 조회
   * GET /groups/{groupId}
   */
  static async getGroupById(req, res, next) {
    try {
      const { groupId } = req.params;
      
      // ID 검증
      const groupIdInt = parseInt(groupId, 10);
      if (isNaN(groupIdInt) || groupIdInt < 1) {
        const error = new Error('유효하지 않은 그룹 ID입니다.');
        error.status = 400;
        throw error;
      }

      const group = await prisma.group.findUnique({
        where: {
          id: groupIdInt,
        },
        select: {
          id: true,
          name: true,
          description: true,
          photoUrl: true,
          badge: true,
          goalRep: true,
          discordInviteUrl: true,
          createdAt: true,
          updatedAt: true,
          tag: {
            select: {
              name: true,
            },
          },
          owner: {
            select: {
              id: true,
              nickname: true,
            },
          },
          _count: {
            select: {
              participants: true,
              groupRecommend: true,
            },
          },
        },
      });

      if (!group) {
        const error = new Error('존재하지 않는 그룹입니다.');
        error.status = 404;
        throw error;
      }

      // 응답 데이터 가공
      const groupDetail = {
        id: group.id,
        name: group.name,
        description: group.description,
        nickname: group.owner.nickname,
        photoUrl: group.photoUrl,
        badge: group.badge,
        tags: group.tag.map((t) => t.name),
        goalRep: group.goalRep,
        participantCount: group._count.participants,
        recommendCount: group._count.groupRecommend,
        discordInviteUrl: group.discordInviteUrl,
        owner: group.owner,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      };

      res.status(200).json({
        success: true,
        data: groupDetail,
      });
    } catch (error) {
      next(error);
    }
  }

  /** 
   * 그룹 생성
  */
  static async postGroup(req, res, next) {
    try{
      const {ownerNickname, ownerPassword, tags, ...groupData} = req.body;
      const postGroup = await prisma.$transaction(async (tx) => {
        // 오너 유저 생성
        const owner = await tx.user.create({
          data: {
            nickname: ownerNickname,
            password: ownerPassword,
          }
        });
        // 그룹 생성
        const group = await tx.group.create({
          data: {
            ...groupData,
            ownerId: owner.id,
          },
        });
        //태그 생성
        const createedtags = await Promise.all(
          tags.map(name => 
            tx.tag.create({
              data: { 
                name: name,
                groupId: group.id
              }
            })
          )
        );
        //오너 참여자 등록
        await tx.participant.create({
          data: {
            groupId: group.id,
            userId: owner.id
          }
        });
        //groupRecommend 카운트(생성시기라 0임)
        const likeCount = await tx.groupRecommend.count({
          where: { groupId: group.id },
        });
        //응답 데이터 가공
        const response = {
          id: group.id,
          name: group.name,
          description: group.description,
          photoUrl: group.photoUrl,
          goalRep: group.goalRep,
          discordWebhookUrl: group.discordWebhookUrl,
          discordInviteUrl: group.discordInviteUrl,
          likeCount: likeCount,
          tags: createedtags.map(tag => tag.name),
          owner: {
            id: owner.id,
            nickname: owner.nickname,
            createdAt: owner.createdAt.getTime(),
            updatedAt: owner.updatedAt.getTime()
          },
          participants: [
            {
              id: owner.id,
              nickname: owner.nickname,
              createdAt: owner.createdAt.getTime(),
              updatedAt: owner.updatedAt.getTime()
            }
          ],
          createdAt: group.createdAt.getTime(),
          updatedAt: group.updatedAt.getTime(),
          badges: group.badge // 초기 상태에서는 빈 배열
        };
        return response;
      });
      res.status(200).json({
        success: true,
        data: postGroup,
      });
    } catch (error) {
      next(error);
    }
  }
  /** 
   * 그룹 패치  
  */
  static async patchGroup(req, res, next) {
    try {
      const id = parseInt(req.params.groupId);
      const {tags, ownerPassword, ownerNickname, ...updateData } = req.body;
      // 패치할 그룹 찾기
      const existingGroup = await prisma.group.findUnique({
        where: { id: id },
        include: {
          owner: {
            select: {
              id: true,
              nickname: true,
              password: true,
            }
          },
          participants: true,
          tag: true,
        }
      });
      if (!existingGroup) {
        return res.status(400).json({ "message": "Group not found" })
      }
      // 패스 워드 확인
      if (existingGroup.owner.password === ownerPassword) {
        // 트랜잭션으로 동시 실행
        const patchGroup = await prisma.$transaction(async (tx) => {
          let tag;
          if (tags) {
            // 기존 태그 삭제
            await Promise.all( 
              existingGroup.tag.map(tag => {
                return tx.tag.delete({
                  where: { id: tag.id },
                })
              })
            )
            //새 태그 생성
            tag = await Promise.all(
              tags.map(name => {
                return tx.tag.create({
                  data: { name: name,
                    group: { connect: { id: id }},
                  },
                })
              }),
            )
          } else {
            //태그 패치 없을시 기존 태그 가져오기
            tag = existingGroup. tag;
          }
          // 오너 업데이트
          const owner = await tx.user.update({
            where : { id: existingGroup.owner.id },
            data: { nickname: ownerNickname }
          })
          // 그룹 업데이트
          const group = await tx.group.update({
            where: { id: id },
            include: {
              owner: true,
            },
            data: updateData,
          });
          // 참여자 조회
          const participant = await tx.participant.findMany({
            where: {
              id: { in: existingGroup.participants.map(participant => participant.id)}
            }
          })
          // groupRecommend 카운트
          const likeCount = await tx.groupRecommend.count({
            where: { groupId: group.id },
          });
          // 응답 데이터 가공
          const response = {
            id: group.id,
            name: group.name,
            description: group.description,
            photoUrl: group.photoUrl,
            goalRep: group.goalRep,
            discordWebhookUrl: group.discordWebhookUrl,
            discordInviteUrl: group.discordInviteUrl,
            likeCount: likeCount,
            tags: tag.map(t => t.name),
            owner: {
              id: owner.id,
              nickname: owner.nickname,
              createdAt: owner.createdAt,
              updatedAt: owner.updatedAt,
            },
            participants: participant,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
            badges: group.badge
          };
          return response
        });
        return res.status(200).json({
          success: true,
          data: patchGroup,
        });
      } else {
        return res.status(403).json({ error: '비밀번호가 틀렸습니다.' });
      }
    } catch (error) {
      next(error);
    }
  }
  /** 
   * 그룹 삭제
  */
  static async deleteGroup(req, res, next) {
    try {
      const id = parseInt(req.params.groupId)
      const { password } = req.body;
      // 삭제 그룹 조회
      const existingGroup = await prisma.group.findUnique({
        where: { id: id},
        include: {
          owner: true,
        }
      });
      if (!existingGroup) {
        return res.status(404).json({ "message": "Group not found" })
      }
      // 패스 워드 확인
      if (existingGroup.owner.password === password) {
        await prisma.group.delete({
          where: { id: id }
        })
        return res.status(200).json({ "ownerPassword": existingGroup.owner.password })
      } else {
        return res.status(401).json({ "message": "Wrong password" });
      }
    } catch(error) {
      next(error);
    }
  }
}

module.exports = GroupController;