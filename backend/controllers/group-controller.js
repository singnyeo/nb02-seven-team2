const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class GroupController {
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

module.exports = new GroupController();