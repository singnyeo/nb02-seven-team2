const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class RecordController {
  /**
   *  운동 기록 목록 조회
   */
  static async getGroupRecords(req, res, next) {
    try {
      const { groupId } = req.params;
      const {
        page = 1,
        limit = 10,
        order = 'desc',
        orderBy = 'createdAt',
        search = '',
        sport = '', 
      } = req.query;

      const groupIdNum = Number(groupId);
      if (isNaN(groupIdNum)) {
        return res.status(400).json({ message: 'Invalid groupId' });
      }

      const group = await prisma.group.findUnique({ where: { id: groupIdNum } });
      if (!group) return res.status(404).json({ message: 'Group not found' });

      // 그룹에 속한 userId 리스트 조회
      const participants = await prisma.participant.findMany({
        where: { groupId: groupIdNum },
        select: { userId: true },
      });
      const userIds = participants.map(p => p.userId);

      // 정렬 조건
      const sortField = orderBy === 'time' ? 'duration' : 'createdAt';
      const sortOrder = ['asc', 'desc'].includes(order) ? order : 'desc';

      const where = {
        userId: { in: userIds },
        ...(sport && { sport }), 
        user: {
          nickname: { contains: search.trim(), mode: 'insensitive' },
        },
      };

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const offset = (pageNum - 1) * limitNum;

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
      // 응답 데이터 가공공
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