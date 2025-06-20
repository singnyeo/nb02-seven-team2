const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger 설정 옵션
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NB2 SEVEN API 명세서',
      version: '1.0.0',
      description: 'NB2 SEVEN API 명세서입니다. 이 문서는 그룹 생성, 조회, 수정, 삭제 및 운동 기록 관리와 관련된 API 엔드포인트를 포함합니다.',
    },
    tags: [
      {
        name: '그룹',
        description: '그룹 관련 API',
      },
      {
        name: '참여자',
        description: '그룹 참여자 관련 API',
      },
      {
        name: '랭킹',
        description: '그룹 랭킹 관련 API',
      },
      {
        name: '운동 기록',
        description: '그룹 운동 기록 관련 API',
      },
      {
        name: '그룹 좋아요',
        description: '그룹 좋아요 관련 API',
      },
      {
        name: '태그',
        description: '태그 관련 API',
      },
      {
        name: '이미지 업로드',
        description: '이미지 업로드 관련 api',
      },
    ],
  },
  apis: ['./routes/*.js', './swagger/*'], // 주석을 이용한 API 문서 경로
};

// Swagger 문서 생성
const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = {
  swaggerSpec,
  swaggerUi,
};