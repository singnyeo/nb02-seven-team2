const { startOfDay, subDays } = require('date-fns');
const prisma = require('../utils/db');
const {
  object,
  string,
  optional,
  enums,
  validate,
} = require('superstruct');

class RecordViewController {
  /**
   * 운동 랭킹 조회
   */
  static async getRank(req, res, next) {
    try {
      // 파라미터 검증
      const paramsSchema = object({ groupId: string() });
      const querySchema = object({
        duration: optional(enums(['monthly', 'weekly'])),
        limit: optional(string()),
        page: optional(string()),
      });

      validate(req.params, paramsSchema);
      validate(req.query, querySchema);

      const groupId = parseInt(req.params.groupId, 10);
      const { duration = 'weekly', limit = 10, page = 1 } = req.query;

      // 그룹 존재 확인
      const group = await prisma.group.findUnique({
        where: { id: groupId },
      });

      if (!group) {
        return res.status(404).json({ message: '그룹을 찾을 수 없습니다' });
      }

      // 기간 설정 (월간 / 주간)
      const days = duration === 'monthly' ? 30 : 7;
      const startDate = startOfDay(subDays(new Date(), days));

      // 운동 기록 조회
      const records = await prisma.exerciseRecord.findMany({
        where: {
          createdAt: { gte: startDate },
          user: {
            participantedGroups: {
              some: { groupId },
            },
          },
        },
        select: {
          userId: true,
          duration: true,
          user: { select: { nickname: true } },
        },
      });

      // 랭킹 계산
      const rankMap = {};
      records.forEach((record) => {
        if (!rankMap[record.userId]) {
          rankMap[record.userId] = {
            participantId: record.userId,
            nickname: record.user.nickname,
            recordCount: 0,
            recordTime: 0,
          };
        }
        rankMap[record.userId].recordCount += 1;
        rankMap[record.userId].recordTime += record.duration;
      });

      // 정렬 및 페이지네이션
      const ranking = Object.values(rankMap)
        .sort((a, b) => b.recordTime - a.recordTime);

      const startIndex = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const result = ranking.slice(startIndex, startIndex + parseInt(limit, 10));

      return res.json(result);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 운동 기록 상세 조회
   */
  static async getRecordById(req, res, next) {
    try {
      // 파라미터 검증
      const paramsSchema = object({
        groupId: string(),
        recordId: string(),
      });

      validate(req.params, paramsSchema);

      const groupId = parseInt(req.params.groupId, 10);
      const recordId = parseInt(req.params.recordId, 10);

      // 그룹 존재 확인
      const group = await prisma.group.findUnique({
        where: { id: groupId },
      });

      if (!group) {
        return res.status(404).json({ message: '그룹을 찾을 수 없습니다' });
      }

      // 운동 기록 조회
      const record = await prisma.exerciseRecord.findFirst({
        where: {
          id: recordId,
          user: {
            participantedGroups: {
              some: { groupId },
            },
          },
        },
        select: {
          id: true,
          sport: true,
          description: true,
          duration: true,
          distance: true,
          photo: { select: { url: true } },
          user: { select: { id: true, nickname: true } },
        },
      });

      if (!record) {
        return res.status(404).json({ message: '해당 운동기록을 찾을 수 없습니다' });
      }

      // 응답 데이터 포맷팅
      return res.json({
        id: record.id,
        exerciseType: record.sport,
        description: record.description,
        time: record.duration,
        distance: record.distance,
        photos: record.photo.map((p) => p.url),
        author: {
          id: record.user.id,
          nickname: record.user.nickname,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = RecordViewController;