const { ERROR_MSG, STATUS_CODE } = require('../utils/const');

class ValidationCheck {
  static validateGroupId(req, res, next) {
    const groupId = Number(req.params.groupId);
    if (Number.isNaN(groupId) || groupId <= 0) {
      return handleError(next, null, ERROR_MSG.INVALID_GROUP_ID, STATUS_CODE.NOT_FOUND);
    }
    return next();
  }

  static validateNickname(req, res, next) {
    const { nickname } = req.body;
    if (typeof nickname !== 'string' || nickname.trim() === '') {
      return handleError(next, null, ERROR_MSG.INVALID_NICKNAME, STATUS_CODE.NOT_FOUND);
    }
    return next();
  }

  static validatePassword(req, res, next) {
    const { password } = req.body;
    if (typeof password !== 'string' || password.trim() === '') {
      return handleError(next, null, ERROR_MSG.INVALID_PASSWORD, STATUS_CODE.NOT_FOUND);
    }
    return next();
  }

  static checkPasswordLength(req, res, next) {
    const { password } = req.body;
    if (process.env.NODE_ENV === 'production' && password.length < 8) {
      return handleError(next, null, ERROR_MSG.PASSWORD_TOO_SHORT, STATUS_CODE.NOT_FOUND);
    }
    return next();
  }

}

module.exports = ValidationCheck;
