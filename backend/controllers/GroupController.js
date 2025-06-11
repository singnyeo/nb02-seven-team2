const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class GroupController {
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
      const id = parseInt(req.params.id)
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
        Participants: true,
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
          tag = await tx.tag.findMany({
            where: { 
              id: { in: existingGroup.tag.map(tag => tag.id) }
            },
          });
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
            id: { in: existingGroup.Participants.map(participant => participant.id)}
          }
        })
        // groupRecommend 카운트트
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
        const id = parseInt(req.params.id)
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