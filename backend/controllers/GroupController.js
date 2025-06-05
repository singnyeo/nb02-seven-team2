const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class GroupController {
  /**
   * 그룹 추천
   */
  async recommendGroup(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      // 필수 값 검증
      if (!userId) {
        const error = new Error('사용자 ID가 필요합니다.');
        error.status = 400;
        throw error;
      }

      const groupId = parseInt(id, 10);
      const userIdInt = parseInt(userId, 10);

      // 그룹 존재 여부와 기존 추천 여부를 한 번에 확인 (ORM 고급 활용)
      const [group, existingRecommend] = await Promise.all([
        prisma.group.findUnique({
          where: { id: groupId },
          select: { id: true },
        }),
        prisma.groupRecommend.findUnique({
          where: {
            groupId_userId: {
              groupId,
              userId: userIdInt,
            },
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

      // 추천 생성 후 추천 수 조회를 한 번에 처리
      const [newRecommend, recommendCount] = await Promise.all([
        prisma.groupRecommend.create({
          data: {
            groupId,
            userId: userIdInt,
          },
        }),
        prisma.groupRecommend.count({
          where: { groupId },
        }),
      ]);

      res.status(201).json({
        success: true,
        message: '그룹을 추천했습니다.',
        data: {
          recommendCount: recommendCount + 1, // 방금 생성한 것 포함
        },
      });
    } catch (error) {
      next(error); // Global Error Handler로 전달
    }
  }

  /**
   * 그룹 추천 취소
   */
  async unrecommendGroup(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      // 필수 값 검증
      if (!userId) {
        const error = new Error('사용자 ID가 필요합니다.');
        error.status = 400;
        throw error;
      }

      const groupId = parseInt(id, 10);
      const userIdInt = parseInt(userId, 10);

      // 그룹 존재 여부와 추천 여부를 한 번에 확인 (ORM 고급 활용)
      const [group, existingRecommend] = await Promise.all([
        prisma.group.findUnique({
          where: { id: groupId },
          select: { id: true },
        }),
        prisma.groupRecommend.findUnique({
          where: {
            groupId_userId: {
              groupId,
              userId: userIdInt,
            },
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

      // 추천 삭제 후 추천 수 조회를 한 번에 처리
      await Promise.all([
        prisma.groupRecommend.delete({
          where: { id: existingRecommend.id },
        }),
      ]);

      // 삭제 후 현재 추천 수 조회
      const recommendCount = await prisma.groupRecommend.count({
        where: { groupId },
      });

      res.status(200).json({
        success: true,
        message: '그룹 추천을 취소했습니다.',
        data: {
          recommendCount,
        },
      });
    } catch (error) {
      next(error); // Global Error Handler로 전달
    }
  }
}

module.exports = new GroupController();
