module.exports = (err, req, res, next) => {
  console.error('[백엔드] Error:', err);

  const statusCode = err.status || 500;
  const message = err.message || '서버 내부 오류';

  res.status(statusCode).json({ message });
};