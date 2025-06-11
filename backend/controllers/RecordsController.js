const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 운동 기록 목록 조회
class RecordController {
  async getGroupRecords(req, res, next) {
    try {
      const { groupId } = req.params;
      const {
        page = 1,
        limit = 10,
        order = 'desc',
        orderBy = 'createdAt',
        search = '',
      } = req.query;

      // groupId 유효성 검사
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
        userId: { in: userIds }, // 그룹에 속한 사용자만 조회
        nickname: { contains: search.trim(), mode: 'insensitive' }, // 검색어 필터링
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
            User: { select: { id: true, nickname: true } },
            Photo: { select: { url: true } },
          },
        }),
      ]);

      //데이터 가공
      const data = records.map(record => ({
        id: record.id,
        sport: record.sport,
        description: record.description,
        time: record.duration,
        distance: record.distance,
        photos: record.Photo.map(p => p.url),
        author: {
          id: record.User.id,
          nickname: record.User.nickname,
        },
      }));

      return res.status(200).json({ data, total });
    } catch (err) {
      next(err);
    }
  }
}
module.exports = new RecordController();