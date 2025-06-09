const express = require('express');
const prisma = require('../utils/db');
const router = express.Router({ mergeParams: true });
const { startOfDay, subDays } = require('date-fns');

router.get('/rank', async (req, res) => {
  const groupId = Number(req.params.groupId);
  const { duration } = req.query;

  if (!Number.isInteger(groupId)) {
    console.log('groupId 정수 아님', req.params.groupId);
    return res.status(400).json({ message: 'groupId는 정수이여야 합니다.' });
  }

  const now = new Date();

  const fromDate = duration === 'monthly' ? startOfDay(subDays(now, 30)) : startOfDay(subDays(now, 7));

  try {
    const records = await prisma.exerciseRecord.findMany({
      where: {
        createdAt: { gte: fromDate },
        user: { groupId: groupId },
      },
      select: {
        userId: true,
        nickname: true,
        duration: true,
      },
    });

    const rankMap = {};

    records.forEach(record => {
      if (!rankMap[record.userId]) {
        rankMap[record.userId] = {
          participantId: record.userId,
          nickname: record.nickname,
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
    const pageSize = 10;
    const pagedRankList = rankList.slice((page - 1) * pageSize, page * pageSize);

    res.json(pagedRankList);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류 발생' });
  }
});

module.exports = router;