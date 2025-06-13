const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { STATUS_CODE } = require("./utils/const");
require('dotenv').config();


const app = express();
const groupRoutes = require("./routes/groups");
const errorHandler = require("./middlewares/error-handler");
// 라우터 import
const groupRoutes = require('./routes/groups');

const app = express();
const { STATUS_CODE } = require('./utils/const');

app.use(cors()); 
app.use(morgan("combined"));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// 라우터 연결

const groupRoutes = require('./routes/groups');

app.use('/groups', groupRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: '운동 인증 커뮤니티 API 서버',
    version: '1.0.0',
  });
});

// 404 핸들러
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "요청하신 리소스를 찾을 수 없습니다." });
});

// 오류 처리 미들웨어
app.use(errorHandler);

// process handlers
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at.", promise, "reason.", reason);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception.", error);
  process.exit(1);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[백엔드] 서버 실행 중 http://localhost:${PORT}`);
});