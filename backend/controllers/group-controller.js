const express = require('express');
const { hashPassword, comparePassword } = require('../utils/password');
const prisma = require('../utils/db');


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
        orderBy = 'createdAt',
        order = 'desc',
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

      // orderBy와 order 기반 정렬
      if (orderBy === 'likeCount' || orderBy === 'participantCount') {
        // 모든 그룹을 조회 (검색 조건 적용)
        const allGroups = await prisma.group.findMany({
          where: whereCondition,
          select: {
            id: true,
            name: true,
            photoUrl: true,
            goalRep: true,
            createdAt: true,
            updatedAt: true,
            owner: {
              select: {
                id: true,
                nickname: true,
                createdAt: true,  // 추가
                updatedAt: true,  // 추가
              },
            },
            tag: {
              select: {
                name: true,
              },
            },
            badge: true, // badge 추가
            participants: {
              select: {
                user: {
                  select: {
                    id: true,
                    nickname: true,
                    createdAt: true,
                    updatedAt: true,
                        },
                },
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
          let compareValue = 0;
          if (orderBy === 'likeCount') {
            compareValue = b._count.groupRecommend - a._count.groupRecommend;
          } else if (orderBy === 'participantCount') {
            compareValue = b._count.participants - a._count.participants;
          }
          
          // order가 'asc'면 순서 반대로
          return order === 'asc' ? -compareValue : compareValue;
        });

        // 페이지네이션 적용
        groups = allGroups.slice(offset, offset + limitNum);
      } else {
        // createdAt 정렬 (기본)
        groups = await prisma.group.findMany({
          where: whereCondition,
          orderBy: [
            {
              createdAt: order === 'asc' ? 'asc' : 'desc',
            },
          ],
          skip: offset,
          take: limitNum,
          select: {
            id: true,
            name: true,
            photoUrl: true,
            goalRep: true,
            createdAt: true,
            updatedAt: true,
            owner: {
              select: {
                id: true,
                nickname: true,
                createdAt: true,  // 추가
                updatedAt: true,  // 추가
              },
            },
            tag: {
              select: {
                name: true,
              },
            },
            badge: true, // badge 추가
            participants: {
              select: {
                user: {
                  select: {
                    id: true,
                    nickname: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
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

      // 응답 데이터 가공 - 명세서에 맞게 수정
      const groupList = groups.map((group) => ({
        id: group.id,
        name: group.name,
        description: group.description || "",
        photoUrl: group.photoUrl,
        goalRep: group.goalRep,
        discordWebhookUrl: group.discordWebhookUrl || "",
        discordInviteUrl: group.discordInviteUrl || "",
        likeCount: group._count.groupRecommend,
        tags: group.tag.map((t) => t.name),
        owner: {
          id: group.owner.id,
          nickname: group.owner.nickname,
          createdAt: group.owner.createdAt.getTime(), // 실제 시간값으로 변경
          updatedAt: group.owner.updatedAt.getTime(), // 실제 시간값으로 변경
        },
        participants: group.participants.map((p) => ({
          id: p.user.id,
          nickname: p.user.nickname,
          createdAt: p.user.createdAt.getTime(),
          updatedAt: p.user.updatedAt.getTime(),
        })),
        createdAt: group.createdAt.getTime(),
        updatedAt: group.updatedAt.getTime(),
        badges: group.badge || [],  // badage는 이미 string[]타입, 빈 값에서 변경
      }));

      res.status(200).json({
        data: groupList,
        total: totalCount,
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
          goalRep: true,
          discordInviteUrl: true,
          discordWebhookUrl: true, // 추가
          createdAt: true,
          updatedAt: true,
          tag: {
            select: {
              name: true,
            },
          },
          badge: true, // badge 추가
          owner: {
            select: {
              id: true,
              nickname: true,
              createdAt: true,  // 추가
              updatedAt: true,  // 추가
            },
          },
          participants: {
            select: {
              user: {
                select: {
                  id: true,
                  nickname: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
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

     // 응답 데이터 가공 - 명세서에 맞게 수정
      const groupDetail = {
        id: group.id,
        name: group.name,
        description: group.description,
        photoUrl: group.photoUrl,
        goalRep: group.goalRep,
        discordWebhookUrl: group.discordWebhookUrl,
        discordInviteUrl: group.discordInviteUrl,
        likeCount: group._count.groupRecommend,
        tags: group.tag.map((t) => t.name),
        owner: {
          id: group.owner.id,
          nickname: group.owner.nickname,
          createdAt: group.owner.createdAt.getTime(),  // 실제 시간으로 변경
          updatedAt: group.owner.updatedAt.getTime(),  // 실제 시간으로 변경
        },
        participants: group.participants.map((p) => ({
          id: p.user.id,
          nickname: p.user.nickname,
          createdAt: p.user.createdAt.getTime(),
          updatedAt: p.user.updatedAt.getTime(),
        })),
        createdAt: group.createdAt.getTime(),
        updatedAt: group.updatedAt.getTime(),
        badges: group.badge || [],  // badge는 이미 string[]타입, 빈 값에서 변경
      }; 

      res.status(200).json(groupDetail);
    } catch (error) {
      next(error);
    }
  }

  /** 
   * 그룹 생성
  */
  static async postGroup(req, res, next) {
    try{
      const {ownerNickname, ownerPassword, tags, photoUrl, ...groupData} = req.body;
      const hashedPassword = await hashPassword(ownerPassword);
      const photoUrlvalid = photoUrl;
      const postGroup = await prisma.$transaction(async (tx) => {
        // 오너 유저 생성
        const owner = await tx.user.create({
          data: {
            nickname: ownerNickname,
            password: hashedPassword,
          }
        });
        // 그룹 생성
        const group = await tx.group.create({
          data: {
            ...groupData,
            photoUrl: photoUrlvalid,
            ownerId: owner.id,
          },
        });
        //태그 생성
        const createdTags = await Promise.all(
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
        const ownerParticipant = await tx.participant.create({
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
          tags: createdTags.map(tag => tag.name),
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
          badges: group.badge || [],
        };
        return response;
      });
      res.status(201).json(postGroup);
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
          participants: {
            include: {
              user: true
            }
          },
          tag: true,
          _count: {
            select: {
              groupRecommend: true,
            }
          }
        }
      });
      if (!existingGroup) {
        return res.status(400).json({ "message": "Group not found" })
      }
      // 패스 워드 확인
      const isMatchPassword = await comparePassword(ownerPassword, existingGroup.owner.password);
      if (isMatchPassword) {
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
                  data: { 
                    name: name,
                    groupId: id
                  },
                })
              }),
            )
          } else {
            //태그 패치 없을시 기존 태그 가져오기
            tag = existingGroup.tag;
          }
          // 오너 업데이트 (ownerNickname이 있을 때만)
          let owner = existingGroup.owner;
          if (ownerNickname) {
            owner = await tx.user.update({
              where : { id: existingGroup.owner.id },
              data: { nickname: ownerNickname },
            });
          }
          // 그룹 업데이트
          const group = await tx.group.update({
            where: { id: id },
            data: updateData,
          });
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
              createdAt: owner.createdAt.getTime(),
              updatedAt: owner.updatedAt.getTime(),
            },
            participants: existingGroup.participants.map(p => ({
              id: p.user.id,
              nickname: p.user.nickname,
              createdAt: p.createdAt.getTime(),
              updatedAt: p.updatedAt.getTime(),
            })),
            createdAt: group.createdAt.getTime(),
            updatedAt: group.updatedAt.getTime(),
            badges: group.badge || [],
          };
          return response
        });
        return res.status(200).json(patchGroup);
      } else {
        return res.status(403).json({ error: '비밀번호가 틀렸습니다.' });
      }
    } catch(error) {
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
      const isMatchPassword = await comparePassword(password, existingGroup.owner.password);
      if (isMatchPassword) {
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

  /**
   * 그룹 추천 (좋아요)
   * POST /groups/{groupId}/likes
   */
  static async recommendGroup(req, res, next) {
    try {
      const { groupId } = req.params;
      // 프론트엔드에서 userId를 보내지 않으므로 임시 처리
      // 실제로는 인증 미들웨어에서 req.user.id 등으로 가져와야 함
      const userId = req.body.userId || 1; // 임시로 1로 설정

      const groupIdInt = parseInt(groupId, 10);
      const userIdInt = parseInt(userId, 10);

      // 그룹 존재 여부와 기존 추천 여부를 한 번에 확인
      const [group, existingRecommend] = await Promise.all([
        prisma.group.findUnique({
          where: { id: groupIdInt },
          select: { id: true },
        }),
        prisma.groupRecommend.findFirst({
          where: {
            groupId: groupIdInt,
            userId: userIdInt,
          },
        }),
      ]);

      if (!group) {
        const error = new Error('존재하지 않는 그룹입니다.');
        error.status = 404;
        throw error;
      }

      if (existingRecommend) {
        const error = new Error('이미 추천한 그룹입니다.');
        error.status = 409;
        throw error;
      }

      // 추천 생성
      await prisma.groupRecommend.create({
        data: {
          groupId: groupIdInt,
          userId: userIdInt,
        },
      });

      res.status(200).json({
        message: '그룹을 추천했습니다.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 그룹 추천 취소 (좋아요 취소)
   * DELETE /groups/{groupId}/likes
   */
  static async unrecommendGroup(req, res, next) {
    try {
      const { groupId } = req.params;
      // 프론트엔드에서 userId를 보내지 않으므로 임시 처리
      const userId = req.body.userId || 1; // 임시로 1로 설정

      const groupIdInt = parseInt(groupId, 10);
      const userIdInt = parseInt(userId, 10);

      // 그룹 존재 여부와 추천 여부를 한 번에 확인
      const [group, existingRecommend] = await Promise.all([
        prisma.group.findUnique({
          where: { id: groupIdInt },
          select: { id: true },
        }),
        prisma.groupRecommend.findFirst({
          where: {
            groupId: groupIdInt,
            userId: userIdInt,
          },
        }),
      ]);

      if (!group) {
        const error = new Error('존재하지 않는 그룹입니다.');
        error.status = 404;
        throw error;
      }

      if (!existingRecommend) {
        const error = new Error('추천하지 않은 그룹입니다.');
        error.status = 404;
        throw error;
      }

      // 추천 삭제
      await prisma.groupRecommend.delete({
        where: { id: existingRecommend.id },
      });

      res.status(200).json({
        message: '그룹 추천을 취소했습니다.',
      });
    } catch (error) {
      next(error);
    }
  }
}

// 클래스 자체를 export (인스턴스가 아닌)
module.exports = GroupController;