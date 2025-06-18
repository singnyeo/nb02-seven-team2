const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

/**
 * @description 비밀번호를 해시화하는 함수
 *
 * @param {string} password - 입력 받은 비밀번호
 * @returns {Promise<string>} - 해시된 비밀번호
 * 
 * @example const hashedPassword = await hashPassword('mySecretPassword');
 */
const hashPassword = async (password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    throw new Error('비밀번호 해시화 중 오류가 발생했습니다.');
  }
}

/**
 * @description 비밀번호를 비교하는 함수
 *
 * @param {string} password - 입력 받은 비밀번호
 * @param {string} hashedPassword - DB에 저장된 비밀번호(해싱된 값)
 * @returns {Promise<boolean>} - 비밀번호가 일치하는지 여부
 *  
 * @example const isMatch = await comparePassword('mySecretPassword', hashedPassword);
 */
const comparePassword = async (password, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    throw new Error('비밀번호 비교 중 오류가 발생했습니다.');
  }
}
module.exports = {
  hashPassword,
  comparePassword,
};
