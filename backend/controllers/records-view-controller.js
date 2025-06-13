const { startOfDay, subDays } = require('date-fns');
const prisma = require('../utils/db');

class RecordViewController {
  // 그룹별 운동 기록 랭킹 조회 (기간, 페이징 지원)
  static async getRank(req, res, next) {
    const groupId = Number(req.params.groupId);
    const { duration, limit, page } = req.query;

    // groupId가 정수인지 검사
    if (!Number.isInteger(groupId)) {
      const error = new Error('[백엔드] groupId는 정수여야 합니다.');
      error.status = 400;
      return next(error);
    }

    // 해당 그룹 존재 여부 확인
    const groupExists = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true },
    });

    if (!groupExists) {
      return res.status(404).json({ message: '[백엔드] 해당 그룹을 찾을 수 없습니다.' });
    }

    // 조회 기간 설정 (monthly: 30일 전, 그 외: 7일 전)
    const now = new Date();
    const fromDate = startOfDay(
      duration === 'monthly' ? subDays(now, 30) : subDays(now, 7),
    );

    try {
      // 기간 내 그룹 참여자의 운동 기록 조회
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
          user: {
            select: { nickname: true },
          },
        },
      });

      // 사용자별 기록 집계
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

      // 기록 시간 기준 내림차순 정렬
      const rankList = Object.values(rankMap).sort(
        (a, b) => b.recordTime - a.recordTime,
      );

      // 페이징 처리
      const pageNumber = Number(page) || 1;
      const pageSize = Number(limit) || 10;
      const pagedRankList = rankList.slice(
        (pageNumber - 1) * pageSize,
        pageNumber * pageSize,
      );

      return res.json(pagedRankList);
    } catch (error) {
      return next(error);
    }
  }

  // 그룹 내 특정 운동 기록 상세 조회
  static async getRecordById(req, res, next) {
    const groupId = Number(req.params.groupId);
    const recordId = Number(req.params.recordId);

    // groupId 정수 체크
    if (!Number.isInteger(groupId)) {
      return res.status(400).json({ message: '[백엔드] groupId는 정수여야 합니다.' });
    }

    try {
      // 그룹 참여자가 작성한 운동 기록 중 해당 ID의 기록 조회
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
        return res
          .status(404)
          .json({ message: '[백엔드] 기록 또는 작성자를 찾을 수 없습니다.' });
      }

      // 조회 결과를 가공하여 응답
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