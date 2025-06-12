const prisma = require('../utils/db');
const { startOfDay, subDays } = require('date-fns');

class RecordViewController {
  async getRank(req, res, next) {
    const groupId = Number(req.params.groupId);
    const { duration, limit } = req.query;

    if (!Number.isInteger(groupId)) {
      const error = new Error('[백엔드] groupId는 정수여야 합니다.');
      error.status = 400;
      return next(error);
    }

    const now = new Date();
    const fromDate =
      duration === 'monthly'
        ? startOfDay(subDays(now, 30))
        : startOfDay(subDays(now, 7));

    try {
      const records = await prisma.exerciseRecord.findMany({
        where: {
        createdAt: { gte: fromDate },
        user: {
          participantedGroups: {
            some: {
              groupId: groupId,
            },
          },
        },
      },
        select: {
        userId: true,
        duration: true,
        user: {
          select: {
            nickname: true,
          },
        },
      },
    });

      const rankMap = {};
      records.forEach(record => {
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

      const rankList = Object.values(rankMap);
      rankList.sort((a, b) => b.recordTime - a.recordTime);

      const page = Number(req.query.page) || 1;
      const pageSize = Number(limit) || 10;
      const pagedRankList = rankList.slice((page - 1) * pageSize, page * pageSize);

      res.json(pagedRankList);

    } catch (error) {
      next(error);
    }
  }

  async getRecordById(req, res, next) {
    const groupId = Number(req.params.groupId);
    const recordId = Number(req.params.recordId);

    if (!Number.isInteger(groupId)) {
      return res.status(400).json({ message: 'groupId must be integer' });
    }

    try {
      const record = await prisma.exerciseRecord.findFirst({
        where: {
          id: recordId,
          user: {
            participantedGroups: {
              some: {
                groupId: groupId,
              },
            },
          },
        },
        include: {
          photo: { select: { url: true } },
          user: { select: { id: true, nickname: true } },
        },
      });

      if (!record || !record.user) {
        return res.status(404).json({ message: '기록 또는 작성자를 찾을 수 없습니다.' });
      }

      res.json({
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

module.exports = new RecordViewController();