const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class GroupController {
  /**
   * 그룹 목록 조회
   * GET /groups
   */
  async getGroups(req, res, next) {
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
  async getGroupById(req, res, next) {
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
}

module.exports = new GroupController();