const { PrismaClient } = require('@prisma/client');
const { object, string, optional, enums, validate, StructError } = require('superstruct');
const prisma = new PrismaClient();

class RecordController {
  /**
   * 운동 기록 목록 조회
   */
  static async getGroupRecords(req, res, next) {
    const ParamsStruct = object({
      groupId: string(), 
    });

    const QueryStruct = object({
      page: optional(string()), 
      limit: optional(string()), 
      order: optional(enums(['asc', 'desc'])), 
      orderBy: optional(enums(['createdAt', 'duration'])), 
      search: optional(string()), 
      sport: optional(string()), 
    });

    // 유효성 검사
    try {
      validate(req.params, ParamsStruct);
      validate(req.query, QueryStruct);
    } catch (error) {
      if (error instanceof StructError) {
        error.status = 400;
        error.message = '잘못된 요청 정보입니다';
      }
      return next(error);
    }

    try {
      const { groupId } = req.params;
      const { page = 1, limit = 10, order = 'desc', orderBy = 'createdAt', search = '', sport = '' } = req.query;

      const groupIdNum = Number(groupId);
      if (isNaN(groupIdNum)) {
        return res.status(400).json({ message: 'Invalid groupId' });
      }

      // 그룹 존재 여부 확인
      const group = await prisma.group.findUnique({ where: { id: groupIdNum } });
      if (!group) {
        return res.status(404).json({ message: '그룹을 찾을 수 없습니다' });
      }

      // 그룹에 속한 사용자 리스트 조회
      const participants = await prisma.participant.findMany({
        where: { groupId: groupIdNum },
        select: { userId: true },
      });
      const userIds = participants.map(p => p.userId);

      // 정렬 및 필터링 조건 설정
      const sortField = orderBy === 'duration' ? 'duration' : 'createdAt';
      const sortOrder = ['asc', 'desc'].includes(order) ? order : 'desc';

      const where = {
        userId: { in: userIds },
        ...(sport && { sport }), 
        user: {
          nickname: { contains: search.trim(), mode: 'insensitive' },
        },
      };

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const offset = (pageNum - 1) * limitNum;

      // 조회
      const [total, records] = await Promise.all([
        prisma.exerciseRecord.count({ where }),
        prisma.exerciseRecord.findMany({
          where,
          orderBy: { [sortField]: sortOrder },
          skip: offset,
          take: limitNum,
          include: {
            user: { select: { id: true, nickname: true } },
            photo: { select: { url: true } },
          },
        }),
      ]);

      // 응답 데이터 가공
      const data = records.map(record => ({
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
      }));

      return res.status(200).json({ data, total });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = RecordController;
