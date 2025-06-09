const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class GroupController {
  /**
   * 그룹 목록 조회
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

      // 검색 조건
      const whereCondition = search
        ? {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          }
        : {};

      // 정렬 조건
      let orderBy;
      switch (sort) {
        case 'recommend':
          orderBy = [
            {
              GroupRecommend: {
                _count: 'desc',
              },
            },
          ];
          break;
        case 'participants':
          orderBy = [
            {
              User: {
                _count: 'desc',
              },
            },
          ];
          break;
        case 'latest':
        default:
          orderBy = [
            {
              createdAt: 'desc',
            },
          ];
          break;
      }

      // 전체 개수와 그룹 목록을 한 번에 조회 (ORM 고급 활용)
      const [totalCount, groups] = await Promise.all([
        prisma.group.count({
          where: whereCondition,
        }),
        prisma.group.findMany({
          where: whereCondition,
          orderBy,
          skip: offset,
          take: limitNum,
          select: {
            id: true,
            name: true,
            nickname: true,
            badge: true,
            targetCount: true,
            tag: {
              select: {
                name: true,
              },
            },
            // 연결된 모델의 개수를 한 번에 조회
            _count: {
              select: {
                User: true,
                GroupRecommend: true,
              },
            },
          },
        }),
      ]);

      // 응답 데이터 가공
      const groupList = groups.map((group) => ({
        id: group.id,
        name: group.name,
        nickname: group.nickname,
        badge: group.badge,
        tags: group.tag.map((t) => t.name),
        targetCount: group.targetCount,
        recommendCount: group._count.GroupRecommend,
        participantCount: group._count.User,
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
      next(error); // Global Error Handler로 전달
    }
  }

  /**
   * 그룹 상세 조회
   */
  async getGroupById(req, res, next) {
    try {
      const { id } = req.params;

      const group = await prisma.group.findUnique({
        where: {
          id: parseInt(id, 10),
        },
        select: {
          id: true,
          name: true,
          description: true,
          nickname: true,
          badge: true,
          targetCount: true,
          discordUrl: true,
          tag: {
            select: {
              name: true,
            },
          },
          // 참여자 수를 한 번에 조회
          _count: {
            select: {
              User: true,
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
        nickname: group.nickname,
        badge: group.badge,
        tags: group.tag.map((t) => t.name),
        targetCount: group.targetCount,
        participantCount: group._count.User,
        discordUrl: group.discordUrl,
      };

      res.status(200).json({
        success: true,
        data: groupDetail,
      });
    } catch (error) {
      next(error); // Global Error Handler로 전달
    }
  }
}

module.exports = new GroupController();