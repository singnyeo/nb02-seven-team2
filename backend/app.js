const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// 미들웨어 import

const errorHandler = require('./middlewares/error-handler');

// 라우터 import
const groupRoutes = require('./routes/groups');

const app = express();
const { STATUS_CODE } = require('./utils/const');

// 기본 미들웨어 설정
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우터 연결
app.use('/groups', groupRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: '운동 인증 커뮤니티 API 서버',
    version: '1.0.0',
  });
});

// 404 에러 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '요청하신 리소스를 찾을 수 없습니다.',
  });
});

// Global Error Handler 사용 (맨 마지막에 위치)
app.use(errorHandler);

// 처리되지 않은 Promise rejection 핸들러
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 처리되지 않은 예외 핸들러
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).send('서버 에러 발생!');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
});