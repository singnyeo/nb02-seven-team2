const express = require('express');
const cors = require('cors');

const errorHandler = require('./middlewares/errorHandler');
const recordViewRouter = require('./routes/record-view');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/groups/:groupId', recordViewRouter);

app.get('/', (req, res) => {
  res.send('[백엔드] 서버 실행 완료');
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[백엔드] 서버 실행 중 http://localhost:${PORT}`);
});