const { object, string, optional, enums, validate, StructError, array, number, assert } = require('superstruct');
const prisma = require('../utils/db');
const { hashPassword, comparePassword } = require('../utils/password.js');
const { ERROR_MSG, STATUS_CODE } = require('../utils/const');
const handleError = require('../utils/error');

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

  static async createGroupRecord(req, res, next) {
    try {

      // 요청 데이터 검증
      try {
        const reqGroupIdVerifyStruct = string();
        const reqBodyVerifyStruct = object({
          exerciseType: enums(['run', 'bike', 'swim']),
          description: string(),
          time: number(),
          distance: number(),
          photos: array(string()),
          authorNickname: string(),
          authorPassword: string(),
        });

        assert(req.params.groupId, reqGroupIdVerifyStruct);
        assert(req.body, reqBodyVerifyStruct);
      } catch (err) {
        return next(err);
      }

      // 요청 데이터 구조 분해
      const groupId = Number(req.params.groupId);
      const {
        exerciseType: sport,
        description,
        time: duration,
        distance,
        photos,
        authorNickname,
        authorPassword,
      } = req.body;

      // 그룹, 유저 확인
      const group = await prisma.group.findUnique({
        where: { id: groupId }
      });

      if (!group) return handleError(res, null, ERROR_MSG.GROUP_NOT_FOUND, STATUS_CODE.BAD_REQUEST);

      let user = await prisma.user.findUnique({
        where: {
          nickname: authorNickname,
          participantedGroups: {
            some: {
              groupId
            }
          }
        },
      });

      // 유저가 있는데 비번이 틀리면 에러가 발생한다.
      if (user && await comparePassword(authorPassword, user.password) === false) {
        return handleError(res, null, ERROR_MSG.PASSWORD_MISMATCH, STATUS_CODE.UNAUTHORIZED)
      }

      // 기록 생성은 참여자만 생성할 수 있도록 해야 한다.
      if (!user) {
        return handleError(res, null, ERROR_MSG.USER_NOT_FOUND, STATUS_CODE.BAD_REQUEST);
      }

      // 운동 기록 생성
      const recordObj = await prisma.exerciseRecord.create({
        data: {
          sport,
          description,
          duration,
          distance,
          userId: user.id,
          groupId
        }
      });

      // 사진 URL 생성 레코드 생성
      for (const photo of photos) {
        await prisma.photo.create({
          data: {
            url: photo,
            photoTag: "EXERCISERECORD",
            exerciseRecordId: recordObj.id
          }
        });
      }

      // 디스코드 알림 전달
      const groupWebHook = group.discordWebhookUrl;

      const resFromDiscord = await fetch(groupWebHook, {
        method: 'POST',
        headers: { 'content-Type': 'application/json' },
        body: JSON.stringify({ content: '운동기록이 생성되었습니다.' })
      });


      return res.status(STATUS_CODE.CREATED).json({
        id: recordObj.id,
        exerciseType: sport,
        description,
        time: duration,
        distance,
        photos,
        author: {
          id: user.id,
          nickname: user.nickname
        }
      });

    } catch (err) {
      return handleError(res, err, ERROR_MSG.SERVER_ERROR, STATUS_CODE.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = RecordController;
