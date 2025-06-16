const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// 미들웨어 import
const errorHandler = require('./middlewares/error-handler');

// 라우터 import
const groupRoutes = require('./routes/groups');

const { swaggerSpec, swaggerUi } = require('./swagger/swagger');
const { STATUS_CODE } = require('./utils/const');
const morgan = require('morgan');
require('dotenv').config();

// 미들웨어 import - camelCase → kebab-case로 변경
const errorHandler = require('./middlewares/error-handler');

const app = express();

app.use(cors()); 
app.use(morgan("combined"));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// 라우터 연결
app.use('/groups', groupRoutes);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.urlencoded({ extended: true }));

// 라우터 연결
const groupRoutes = require('./routes/groups');
app.use('/groups', groupRoutes);

app.get("/", (req, res) => {
  res.json({ message: "운동 인증 커뮤니티 API 서버", version: "1.0.0" });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: "요청하신 리소스를 찾을 수 없습니다." });
});

// 오류 처리
app.use(errorHandler);

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection.", promise, "reason.", reason);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception.", error);
  process.exit(1);
});

// 서버 실행
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
});

module.exports = app;