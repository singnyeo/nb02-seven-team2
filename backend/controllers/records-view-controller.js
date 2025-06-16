const { startOfDay, subDays } = require('date-fns');
const prisma = require('../utils/db');
const {
  object,
  string,
  optional,
  enums,
  validate,
  StructError,
} = require('superstruct');

class RecordViewController {
  static async getRank(req, res, next) {
    // Params, Query 스키마 정의
    const ParamsStruct = object({
      groupId: string(),
    });
    const QueryStruct = object({
      duration: optional(enums(['monthly', 'weekly'])),
      limit: optional(string()),
      page: optional(string()),
    });

    try {
      validate(req.params, ParamsStruct);
      validate(req.query, QueryStruct);
    } catch (error) {
      if (error instanceof StructError) {
        error.status = 400;
        error.message = '요청 정보가 올바르지 않습니다';
      }
      return next(error);
    }

    const groupId = Number(req.params.groupId);
    if (!Number.isInteger(groupId) || groupId <= 0) {
      return res.status(404).json({ message: '그룹을 찾을 수 없습니다' });
    }

    // 그룹 존재 여부 체크
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true },
    });

    if (!group) {
      return res.status(404).json({ message: '그룹을 찾을 수 없습니다' });
    }

    const { duration, limit, page } = req.query;
    const now = new Date();
    const fromDate = startOfDay(duration === 'monthly' ? subDays(now, 30) : subDays(now, 7));

    try {
      const records = await prisma.exerciseRecord.findMany({
        where: {
          createdAt: { gte: fromDate },
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

      const rankMap = {};
      records.forEach(({ userId, duration: recordDuration, user }) => {
        if (!rankMap[userId]) {
          rankMap[userId] = {
            participantId: userId,
            nickname: user.nickname,
            recordCount: 0,
            recordTime: 0,
          };
        }
        rankMap[userId].recordCount += 1;
        rankMap[userId].recordTime += recordDuration;
      });

      const rankList = Object.values(rankMap).sort((a, b) => b.recordTime - a.recordTime);
      const pageNumber = Number(page) || 1;
      const pageSize = Number(limit) || 10;
      const pagedRankList = rankList.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

      return res.json(pagedRankList);
    } catch (error) {
      return next(error);
    }
  }

  static async getRecordById(req, res, next) {
    // Params 스키마 정의
    const ParamsStruct = object({
      groupId: string(),
      recordId: string(),
    });

    try {
      validate(req.params, ParamsStruct);
    } catch (error) {
      if (error instanceof StructError) {
        error.status = 400;
        error.message = '요청 정보가 올바르지 않습니다';
      }
      return next(error);
    }

    const groupId = Number(req.params.groupId);
    const recordId = Number(req.params.recordId);

    if (!Number.isInteger(groupId) || groupId <= 0) {
      return res.status(404).json({ message: '그룹을 찾을 수 없습니다' });
    }
    if (!Number.isInteger(recordId) || recordId <= 0) {
      return res.status(404).json({ message: '해당 운동기록을 찾을 수 없습니다' });
    }

    // 그룹 존재 여부 체크
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true },
    });

    if (!group) {
      return res.status(404).json({ message: '그룹을 찾을 수 없습니다' });
    }

    try {
      const record = await prisma.exerciseRecord.findFirst({
        where: {
          id: recordId,
          user: {
            participantedGroups: {
              some: { groupId },
            },
          },
        },
        include: {
          photo: { select: { url: true } },
          user: { select: { id: true, nickname: true } },
        },
      });

      if (!record || !record.user) {
        return res.status(404).json({ message: '해당 운동기록을 찾을 수 없습니다' });
      }

      return res.json({
        id: record.id,
        exerciseType: record.sport,
        description: record.description,
        time: record.duration,
        distance: record.distance,
        photos: record.photo.map(({ url }) => url),
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