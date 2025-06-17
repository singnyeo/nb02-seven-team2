const { startOfDay, subDays } = require('date-fns');
const prisma = require('../utils/db');
const { STATUS_CODE, ERROR_MSG } = require('../utils/const');
const handleError = require('../utils/error');

class RecordViewController {
  /**
   * 운동 랭킹 조회
   */
  static async getRank(req, res, next) {
    try {
      const groupId = Number(req.params.groupId);
      if (!groupId || groupId <= 0) {
        return handleError(res, null, ERROR_MSG.INVALID_GROUP_ID, STATUS_CODE.NOT_FOUND);
      }

      const { duration = 'weekly', limit = '10', page = '1' } = req.query;

      const group = await prisma.group.findUnique({ where: { id: groupId } });
      if (!group) {
        return handleError(res, null, ERROR_MSG.GROUP_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }

      const days = duration === 'monthly' ? 30 : 7;
      const startDate = startOfDay(subDays(new Date(), days));

      const records = await prisma.exerciseRecord.findMany({
        where: {
          createdAt: { gte: startDate },
          user: { participantedGroups: { some: { groupId } } },
        },
        select: {
          userId: true,
          duration: true,
          user: { select: { nickname: true } },
        },
      });

      // 사용자별 누적 운동 기록 계산
      const rankMap = records.reduce((acc, record) => {
        if (!acc[record.userId]) {
          acc[record.userId] = {
            participantId: record.userId,
            nickname: record.user.nickname,
            recordCount: 0,
            recordTime: 0,
          };
        }
        acc[record.userId].recordCount += 1;
        acc[record.userId].recordTime += record.duration;
        return acc;
      }, {});

      const ranking = Object.values(rankMap).sort((a, b) => b.recordTime - a.recordTime);

      const pageNum = Number(page);
      const limitNum = Number(limit);
      const startIndex = (pageNum - 1) * limitNum;

      return res.status(STATUS_CODE.SUCCESS).json(ranking.slice(startIndex, startIndex + limitNum));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 운동 기록 상세 조회
   */
  static async getRecordById(req, res, next) {
    try {
      const groupId = Number(req.params.groupId);
      const recordId = Number(req.params.recordId);

      if (!groupId || groupId <= 0) {
        return handleError(res, null, ERROR_MSG.INVALID_GROUP_ID, STATUS_CODE.NOT_FOUND);
      }
      if (!recordId || recordId <= 0) {
        return handleError(res, null, ERROR_MSG.INVALID_RECORD_ID, STATUS_CODE.NOT_FOUND);
      }

      const group = await prisma.group.findUnique({ where: { id: groupId } });
      if (!group) {
        return handleError(res, null, ERROR_MSG.GROUP_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }

      const record = await prisma.exerciseRecord.findFirst({
        where: {
          id: recordId,
          user: { participantedGroups: { some: { groupId } } },
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
        return handleError(res, null, ERROR_MSG.RECORD_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }

      return res.status(STATUS_CODE.SUCCESS).json({
        id: record.id,
        exerciseType: record.sport,
        description: record.description,
        time: record.duration,
        distance: record.distance,
        photos: record.photo.map(p => p.url),
        author: {
          id: record.user.id,
          nickname: record.user.nickname,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = RecordViewController;