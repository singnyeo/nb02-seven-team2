const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

const recordsRoutes = require('./routes/records');
app.use('/groups', recordsRoutes);

app.get('/', (req, res) => {
  res.send('서버가 정상적으로 실행 중');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '서버 오류가 발생했습니다.' });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
});
