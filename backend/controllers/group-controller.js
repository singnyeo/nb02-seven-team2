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
   * 그룹 추천 (좋아요)
   * POST /groups/{groupId}/likes
   */
  async recommendGroup(req, res, next) {
    try {
      const { groupId } = req.params;
      const { userId } = req.body;

      // 필수 값 검증
      if (!userId) {
        const error = new Error('사용자 ID가 필요합니다.');
        error.status = 400;
        throw error;
      }

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

      // 생성 후 현재 추천 수 조회
      const recommendCount = await prisma.groupRecommend.count({
        where: { groupId: groupIdInt },
      });

      res.status(200).json({
        success: true,
        message: '그룹을 추천했습니다.',
        data: {
          groupId: groupIdInt,
          recommendCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 그룹 추천 취소 (좋아요 취소)
   * DELETE /groups/{groupId}/likes
   */
  async unrecommendGroup(req, res, next) {
    try {
      const { groupId } = req.params;
      const { userId } = req.body;

      // 필수 값 검증
      if (!userId) {
        const error = new Error('사용자 ID가 필요합니다.');
        error.status = 400;
        throw error;
      }

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

      // 삭제 후 현재 추천 수 조회
      const recommendCount = await prisma.groupRecommend.count({
        where: { groupId: groupIdInt },
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

}

// 클래스 자체를 export (인스턴스가 아닌)
module.exports = GroupController;