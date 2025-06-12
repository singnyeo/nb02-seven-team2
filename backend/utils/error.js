// utils/error.js
const { ERROR_MSG, STATUS_CODE } = require('./const');

// 공통 에러 응답 함수
const handleError = (
  res,
  error,
  message = ERROR_MSG.SERVER_ERROR,
  status = STATUS_CODE.SERVER_ERROR,
) => {
  console.error(message, error);
  res.status(status).json({ error: message });
};

module.exports = handleError;
