const { CryptoUtils } = require('mythix');

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
} = CryptoUtils;

module.exports = {
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
};
