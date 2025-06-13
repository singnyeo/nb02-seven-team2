const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const errorHandler = require('./middlewares/error-handler');
const groupRoutes = require('./routes/groups');

const app = express();
const groupRoutes = require('./routes/groups');
const { STATUS_CODE } = require('./utils/const');


// 미들웨어
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/groups', groupRoutes);


// 라우터
app.use('/groups', groupRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: '운동 인증 커뮤니티 API 서버',
    version: '1.0.0',
  });
});

// 404 핸들링
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '요청하신 리소스를 찾을 수 없습니다.',
  });
});

// 글로벌 에러 핸들러
app.use(errorHandler);

// 예외 처리
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).send('서버 에러 발생!');
});

// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[백엔드] 서버 실행 중 http://localhost:${PORT}`);
});
