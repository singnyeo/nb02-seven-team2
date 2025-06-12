/**
 * Global Error Handler Middleware
 * Express.js의 일관된 에러 처리를 담당

 * feature/groupRecommend 브랜치용
 */

const errorHandler = (err, req, res, next) => {
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

 */

const errorHandler = (err, req, res, next) => {
  // 에러 로깅 (개발환경에서만 자세한 정보 출력)
  if (process.env.NODE_ENV === 'development') {
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
  } else {
    // 프로덕션에서는 간단한 로그만
    console.error(`${new Date().toISOString()} - ${err.message}`);
  }


  // 에러 상태 코드 설정 (기본값: 500)
  const statusCode = err.status || err.statusCode || 500;

  // 개발 환경과 프로덕션 환경 구분
  const isDevelopment = process.env.NODE_ENV === 'development';

  // 클라이언트에게 보낼 에러 응답
  const errorResponse = {
    success: false,
    message: err.message || '서버 내부 오류가 발생했습니다.',


    errorCode: err.code || 'INTERNAL_SERVER_ERROR', // 에러 코드 추가
    timestamp: new Date().toISOString(),

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

        errorResponse.errorCode = 'DUPLICATE_DATA';
        break;
      case 'P2025':
        errorResponse.message = '요청한 데이터를 찾을 수 없습니다.';
        errorResponse.errorCode = 'DATA_NOT_FOUND';
        break;
      case 'P2003':
        errorResponse.message = '참조 제약 조건을 위반했습니다.';
        errorResponse.errorCode = 'FOREIGN_KEY_CONSTRAINT';
        break;
      case 'P1001':
        errorResponse.message = '데이터베이스 연결에 실패했습니다.';
        errorResponse.errorCode = 'DATABASE_CONNECTION_ERROR';
        break;
      default:
        errorResponse.message = '데이터베이스 오류가 발생했습니다.';
        errorResponse.errorCode = 'DATABASE_ERROR';

        break;
    }
  }

  // 유효성 검사 에러 처리
  if (err.name === 'ValidationError') {
    errorResponse.message = '입력 데이터가 올바르지 않습니다.';

    errorResponse.errorCode = 'VALIDATION_ERROR';

    if (isDevelopment) {
      errorResponse.validationErrors = err.errors;
    }
  }


  // JWT 에러 처리 (추후 인증 기능 추가 시 사용)
  if (err.name === 'JsonWebTokenError') {
    errorResponse.message = '유효하지 않은 토큰입니다.';

  // JWT 에러 처리
  if (err.name === 'JsonWebTokenError') {
    errorResponse.message = '유효하지 않은 토큰입니다.';
    errorResponse.errorCode = 'INVALID_TOKEN';

  }

  if (err.name === 'TokenExpiredError') {
    errorResponse.message = '토큰이 만료되었습니다.';


    errorResponse.errorCode = 'TOKEN_EXPIRED';
  }

  // 타입 에러 처리
  if (err.name === 'TypeError') {
    errorResponse.message = '잘못된 데이터 타입입니다.';
    errorResponse.errorCode = 'TYPE_ERROR';
  }

  // 문법 에러 처리
  if (err.name === 'SyntaxError') {
    errorResponse.message = '요청 형식이 올바르지 않습니다.';
    errorResponse.errorCode = 'SYNTAX_ERROR';
  }

  // 상태 코드별 추가 처리
  if (statusCode === 404 && !err.message.includes('그룹')) {
    errorResponse.message = '요청하신 리소스를 찾을 수 없습니다.';
    errorResponse.errorCode = 'NOT_FOUND';

  }

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;