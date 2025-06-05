const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// 미들웨어 설정
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우터 연결
const groupRoutes = require('./routes/groups');
app.use('/api/groups', groupRoutes);

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

// Global Error Handler (일관된 에러 처리)
app.use((err, req, res, next) => {
  // 에러 로깅
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString(),
  });

  // 에러 상태 코드 설정 (기본값: 500)
  const statusCode = err.status || err.statusCode || 500;

  // 개발 환경과 프로덕션 환경 구분
  const isDevelopment = process.env.NODE_ENV === 'development';

  // 클라이언트에게 보낼 에러 응답
  const errorResponse = {
    success: false,
    message: err.message || '서버 내부 오류가 발생했습니다.',
    ...(isDevelopment && {
      stack: err.stack,
      details: {
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString(),
      },
    }),
  };

  // Prisma 에러 처리
  if (err.code && err.code.startsWith('P')) {
    switch (err.code) {
      case 'P2002':
        errorResponse.message = '중복된 데이터가 존재합니다.';
        break;
      case 'P2025':
        errorResponse.message = '요청한 데이터를 찾을 수 없습니다.';
        break;
      case 'P2003':
        errorResponse.message = '참조 제약 조건을 위반했습니다.';
        break;
      default:
        errorResponse.message = '데이터베이스 오류가 발생했습니다.';
    }
  }

  // 유효성 검사 에러 처리
  if (err.name === 'ValidationError') {
    errorResponse.message = '입력 데이터가 올바르지 않습니다.';
    if (isDevelopment) {
      errorResponse.validationErrors = err.errors;
    }
  }

  res.status(statusCode).json(errorResponse);
});

// 처리되지 않은 Promise rejection 핸들러
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 처리되지 않은 예외 핸들러
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
});

module.exports = app;