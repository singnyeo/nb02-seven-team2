// utils/error.js
const { ERROR_MSG, STATUS_CODE } = require('./const');

// 공통 에러 응답 함수
const handleError = (
  next,
  error,
  message = ERROR_MSG.SERVER_ERROR,
  status = STATUS_CODE.INTERNAL_SERVER_ERROR,
) => {
  console.log('Error:', error);
  const err = new Error(message);
  err.status = status;
  return next(error);
};

module.exports = handleError;
