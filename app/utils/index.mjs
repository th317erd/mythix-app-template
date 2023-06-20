const {
  toBase64,
  convertBase64ToURLSafe,
  convertBase64FromURLSafe,
  toURLSafeBase64,
  fromURLSafeBase64,
  getSaltProperties,
  generateSalt,
  encrypt,
  decrypt,
  hashToken,
  randomBytes,
  randomHash,
  MD5,
  SHA256,
  SHA512,
} = require('./crypto-utils');

const {
  formatPhoneNumber,
} = require('./formatter-utils');

const {
  ErrorBase,
  ForbiddenError,
  UnauthorizedError,
  NotFoundError,
  ValidationError,
} = require('./errors');

const {
  XID,
  isValidID,
  getModelIDPrefixFor,
  getModelNameFromIDPrefix,
  getModelTypeAndIDFromID,
  stripIDPrefix,
  addIDPrefix,
} = require('./model-utils');

const {
  langTerm,
} = require('./i18n-utils');

module.exports = {
  // crypto-utils
  toBase64,
  convertBase64ToURLSafe,
  convertBase64FromURLSafe,
  toURLSafeBase64,
  fromURLSafeBase64,
  getSaltProperties,
  generateSalt,
  encrypt,
  decrypt,
  hashToken,
  randomBytes,
  randomHash,
  MD5,
  SHA256,
  SHA512,

  // formatter-utils
  formatPhoneNumber,

  // errors
  ErrorBase,
  ForbiddenError,
  UnauthorizedError,
  NotFoundError,
  ValidationError,

  // model-utils
  XID,
  isValidID,
  getModelIDPrefixFor,
  getModelNameFromIDPrefix,
  getModelTypeAndIDFromID,
  stripIDPrefix,
  addIDPrefix,

  // i18n-utils
  langTerm,
};
