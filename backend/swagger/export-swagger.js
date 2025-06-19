const path = require('path');
const fs = require('fs');
const { swaggerSpec } = require('./swagger');

const outputPath = path.join(__dirname, 'swagger-output.json'); // 절대경로 사용
fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
console.log('✅ swagger-output.json 파일이 생성되었습니다!');