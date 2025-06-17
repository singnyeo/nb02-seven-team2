const STATUS_CODE = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

const ERROR_MSG = {
  INVALID_GROUP_ID: '유효하지 않은 그룹 ID입니다.',
  INVALID_RECORD_ID: '유효하지 않은 운동 기록 ID입니다.',
  INVALID_NICKNAME: '유효하지 않은 닉네임입니다.',
  INVALID_PASSWORD: '유효하지 않은 비밀번호입니다.',
  PASSWORD_TOO_SHORT: '비밀번호는 최소 8자 이상이어야 합니다.',
  USER_NOT_FOUND: '해당 사용자를 찾을 수 없습니다.',
  GROUP_NOT_FOUND: '해당 그룹을 찾을 수 없습니다.',
  RECORD_NOT_FOUND: '해당 운동기록을 찾을 수 없습니다.',
  NICKNAME_ALREADY_EXISTS: '해당 닉네임이 이미 존재합니다.',
  PARTICIPANT_NOT_FOUND: '해당 닉네임의 참여자를 찾을 수 없습니다.',
  PASSWORD_MISMATCH: '비밀번호가 일치하지 않습니다.',
  DELETE_FAILED: '참여자 삭제 중 오류가 발생하였습니다.',
  SERVER_ERROR: '작업 중 오류가 발생하였습니다.',
};

module.exports = {
  STATUS_CODE,
  ERROR_MSG,
};
