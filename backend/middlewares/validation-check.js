const { ERROR_MSG, STATUS_CODE } = require('../utils/const');
const handleError = require('../utils/error');

const groupDataValidation = (req, res, next) => {
  const groupId = Number(req.params.groupId);
  const { nickname, password } = req.body;

  // 1. groupId가 숫자인지 확인
  if (Number.isNaN(groupId) || groupId <= 0) {
    return handleError(res, null, ERROR_MSG.INVALID_GROUP_ID, STATUS_CODE.NOT_FOUND);
  }
  // 2. 닉네임이 문자열인지 확인
  if (typeof nickname !== 'string' || nickname.trim() === '') {
    return handleError(res, null, ERROR_MSG.INVALID_NICKNAME, STATUS_CODE.NOT_FOUND);
  }
  // 3. 비밀번호가 문자열인지 확인
  if (typeof password !== 'string' || password.trim() === '') {
    return handleError(res, null, ERROR_MSG.INVALID_PASSWORD, STATUS_CODE.NOT_FOUND);
  }
  // 4. 비밀번호 길이 확인
  if (password.length < 8) {
    return handleError(res, null, ERROR_MSG.PASSWORD_TOO_SHORT, STATUS_CODE.NOT_FOUND);
  }
  return next();
};

module.exports = groupDataValidation;
