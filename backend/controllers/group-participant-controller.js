const db = require('../utils/db');
const { ERROR_MSG, STATUS_CODE } = require('../utils/const');
const handleError = require('../utils/error');

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
   * @param {string} req.body.password - 그룹 생성자의 비밀번호
   */
  static async postGroupParticipant(req, res) {
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
      // 2. 그룹 내 닉네임 중복 확인
      if (participant) {
        return handleError(res, null, ERROR_MSG.NICKNAME_ALREADY_EXISTS, STATUS_CODE.NOT_FOUND);
      }
      // 3. 비밀번호 확인
      if (!user || user.password !== password) {
        return handleError(res, null, ERROR_MSG.PASSWORD_MISMATCH, STATUS_CODE.UNAUTHORIZED);
      }
      // 4. 그룹 참여 생성
      const newParticipant = await db.participant.create({
        data: {
          group: { connect: { id: groupId } },
          user: { connect: { id: user.id } },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              nickname: true,
            },
          },
        },
      });
      // 5. 새로운 참여자 정보 결과값 가공 (아래 형태로 출력)
      const response = {
        id: group.id,
        name: group.name,
        description: group.description,
        photoUrl: group.photoUrl,
        goalRep: group.goalRep,
        discordWebhookUrl: group.discordWebhookUrl,
        discordInviteUrl: group.discordInviteUrl,
        likeCount: group.likeCount,
        tags: group.tags,
        owner: { ...group.owner },
        participants: [
          ...(group.participants || []).map((p) => ({
            id: p.id,
            nickname: p.user.nickname,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          })),
          {
            id: newParticipant.id,
            nickname: newParticipant.user.nickname,
            createdAt: newParticipant.createdAt,
            updatedAt: newParticipant.updatedAt,
          },
        ],
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        badges: group.badge, // 배열
      };

      return res.status(STATUS_CODE.CREATED).json({ ...response });
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
 * @param {string} req.body.password - 그룹 생성자의 비밀번호
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
        where: { userId: user.id },
        select: { id: true },
      })).map((record) => record.id);

      await db.$transaction(async (tx) => {
        // 5. 운동 사진 삭제
        await tx.photo.deleteMany({ where: { exerciseRecordId: { in: exerciseRecordIds } } });
        // 6. 운동 기록 삭제
        await tx.exerciseRecord.deleteMany({ where: { userId: user.id } });
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
