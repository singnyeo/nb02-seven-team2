const db = require('../utils/db');
const { ERROR_MSG, STATUS_CODE } = require('../utils/const');
const handleError = require('../utils/error');
const { ta } = require('date-fns/locale');

/** 유저 조회 */
const findUserByNickname = (nickname) => db.user.findUnique({ where: { nickname } });
/** 그룹 조회 */
const findGroupById = (groupId) => db.group.findUnique({ where: { id: groupId } });
/** 그룹 내 참여자 조회 */
const findParticipant = (nickname, groupId) => db.participant.findFirst({
  where: {
    groupId,
    user: { nickname },
  },
});

class GroupParticipantController {
  /**
   * @description 그룹 참여 생성
   * @route POST /groups/:groupId/participants
   *
   * @param {number} req.params.groupId - 그룹 ID
   * @param {string} req.body.nickname - 참여자 닉네임
   * @param {string} req.body.password - 참여자의 비밀번호
   */
  static async postGroupParticipant(req, res) {
    const groupId = Number(req.params.groupId);
    const { nickname, password } = req.body;
    const now = new Date();

    try {
      // 0. 그룹 정보, 참여자 정보, 유저 정보 조회
      const [group, participant] = await Promise.all([findGroupById(groupId), findParticipant(nickname, groupId)]);
      let user = await findUserByNickname(nickname);

      // 1. 그룹 존재 여부 확인
      if (!group) return handleError(res, null, ERROR_MSG.GROUP_NOT_FOUND, STATUS_CODE.BAD_REQUEST);
      // 2. 사용자 확인
      if (user && password !== user.password) return handleError(res, null, ERROR_MSG.PASSWORD_MISMATCH, STATUS_CODE.UNAUTHORIZED);
      // 3. 그룹 내 참여자 존재 조회
      if (participant) return handleError(res, null, ERROR_MSG.PARTICIPANT_ALREADY_EXISTS, STATUS_CODE.BAD_REQUEST);

      // 4. 참여자 생성
      await db.$transaction(async (tx) => {
        // 4-1. 유저가 없으면 생성
        if (!user) {
          user = await tx.user.create({
            data: {
              nickname,
              password,
              createdAt: now,
              updatedAt: now,
            },
          });
        }
        // 4-2. 참여자 생성
        await tx.participant.create({
          data: {
            userId: userObj.id,
            groupId,
            createdAt: now,
            updatedAt: now,
          },
          include: {
            user: {
              select: {
                nickname: true,
              },
            },
          },
        });
      });

      // 5. 그룹 정보 업데이트
      const updatedGroup = await db.group.findUnique({
        where: { id: groupId },
        include: {
          owner: true,
          tag: true,
          participants: { include: { user: true } },
        },
      });

      // 6. 새로운 참여자 정보 결과값 가공
      const response = {
        id: updatedGroup.id,
        name: updatedGroup.name,
        description: updatedGroup.description,
        photoUrl: updatedGroup.photoUrl,
        goalRep: updatedGroup.goalRep,
        discordWebhookUrl: updatedGroup.discordWebhookUrl,
        discordInviteUrl: updatedGroup.discordInviteUrl,
        likeCount: updatedGroup.groupRecommend?.length || 0,
        tags: (updatedGroup.tag || []).map(tag => tag.name),
        owner: {
          id: updatedGroup.owner.id,
          nickname: updatedGroup.owner.nickname,
          createdAt: updatedGroup.owner.createdAt.getTime(),
          updatedAt: updatedGroup.owner.updatedAt.getTime(),
        },
        participants: updatedGroup.participants.map(p => ({
          id: p.id,
          nickname: p.user.nickname,
          createdAt: p.createdAt.getTime(),
          updatedAt: p.updatedAt.getTime(),
        })),
        createdAt: updatedGroup.createdAt.getTime(),
        updatedAt: updatedGroup.updatedAt.getTime(),
        badges: (updatedGroup.badge || []).map(b => b.name),
      };

      res.status(STATUS_CODE.CREATED).json({ ...response });
    } catch (error) {
      return handleError(res, error, ERROR_MSG.SERVER_ERROR, STATUS_CODE.INTERNAL_SERVER_ERROR);
    }
  }

  /**
 * @description 그룹 참여 취소
 * @route DELETE /groups/:groupId/participants
 *
 * @param {number} req.params.groupId - 그룹 ID
 * @param {string} req.body.nickname - 참여자 닉네임
 * @param {string} req.body.password - 참여자의 비밀번호
 */
  static async deleteGroupParticipant(req, res) {
    const groupId = Number(req.params.groupId);
    const { nickname, password } = req.body;

    try {
      const [user, group] = await Promise.all([
        findUserByNickname(nickname),
        findGroupById(groupId),
      ]);
      const participant = await findParticipant(nickname, groupId);
      // 0. 유저 조회
      if (!user) {
        return handleError(res, null, ERROR_MSG.USER_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }
      // 1. 그룹 조회
      if (!group) {
        return handleError(res, null, ERROR_MSG.GROUP_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }
      // 2. 그룹 내 참여자 조회
      if (!participant) {
        return handleError(res, null, ERROR_MSG.PARTICIPANT_NOT_FOUND, STATUS_CODE.NOT_FOUND);
      }
      // 3. 비밀번호 확인
      if (!user || user.password !== password) {
        return handleError(res, null, ERROR_MSG.PASSWORD_MISMATCH, STATUS_CODE.UNAUTHORIZED);
      }
      // 해당 유저의 운동 기록 id 목록 조회
      const exerciseRecordIds = (await db.exerciseRecord.findMany({
        where: { userId: participant.id },
        select: { id: true },
      })).map((record) => record.id);

      await db.$transaction(async (tx) => {
        // 5. 운동 사진 삭제
        await tx.photo.deleteMany({ where: { exerciseRecordId: { in: exerciseRecordIds }, } });
        // 6. 운동 기록 삭제
        await tx.exerciseRecord.deleteMany({ where: { userId: participant.id }, });
        // 4. 참여자 삭제
        await tx.participant.delete({ where: { id: participant.id } });
      });

      return res.status(STATUS_CODE.CREATED).json({ message: '참여자가 성공적으로 삭제되었습니다.' });
    } catch (error) {
      return handleError(res, error, ERROR_MSG.SERVER_ERROR, STATUS_CODE.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = GroupParticipantController;
