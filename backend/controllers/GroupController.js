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

      // 정렬 조건
      let orderBy;
      switch (sort) {
        case 'recommend':
          orderBy = [
            {
              groupRecommend: {
                _count: 'desc',
              },
            },
          ];
          break;
        case 'participants':
          orderBy = [
            {
              Participants: {  // 대문자 P로 수정
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
            photoUrl: true,
            badge: true,
            goalRep: true,
            createdAt: true, // 추가: 생성일시
            // 소유자 닉네임 조회
            owner: {
              select: {
                id: true,
                nickname: true,
              },
            },
            // Tag는 직접 1:N 관계로 조회
            tag: {
              select: {
                name: true,
              },
            },
            // 연결된 모델의 개수를 한 번에 조회
            _count: {
              select: {
                Participants: true, // 대문자 P로 수정
                groupRecommend: true, // 추천 수
              },
            },
          },
        }),
      ]);

      // 응답 데이터 가공
      const groupList = groups.map((group) => ({
        id: group.id,
        name: group.name,
        nickname: group.owner.nickname, // 소유자 닉네임을 그룹 닉네임으로 사용
        photoUrl: group.photoUrl,
        badge: group.badge,
        tags: group.tag.map((t) => t.name),
        goalRep: group.goalRep,
        recommendCount: group._count.groupRecommend,
        participantCount: group._count.Participants, // 대문자 P로 수정
        createdAt: group.createdAt, // 추가
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
      
      // ID 검증
      const groupId = parseInt(id, 10);
      if (isNaN(groupId) || groupId < 1) {
        const error = new Error('유효하지 않은 그룹 ID입니다.');
        error.status = 400;
        throw error;
      }

      const group = await prisma.group.findUnique({
        where: {
          id: groupId,
        },
        select: {
          id: true,
          name: true,
          description: true,
          photoUrl: true,
          badge: true,
          goalRep: true,
          discordInviteUrl: true,
          createdAt: true, // 추가
          updatedAt: true, // 추가
          // Tag는 직접 1:N 관계로 조회
          tag: {
            select: {
              name: true,
            },
          },
          // 소유자 정보
          owner: {
            select: {
              id: true,
              nickname: true,
            },
          },
          // 참여자 수를 한 번에 조회
          _count: {
            select: {
              Participants: true, // 대문자 P로 수정
              groupRecommend: true, // 추천 수도 추가
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
        nickname: group.owner.nickname, // 소유자 닉네임을 그룹 닉네임으로 사용
        photoUrl: group.photoUrl,
        badge: group.badge,
        tags: group.tag.map((t) => t.name),
        goalRep: group.goalRep,
        participantCount: group._count.Participants, // 대문자 P로 수정
        recommendCount: group._count.groupRecommend, // 추천 수 추가
        discordInviteUrl: group.discordInviteUrl,
        owner: group.owner,
        createdAt: group.createdAt, // 추가
        updatedAt: group.updatedAt, // 추가
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