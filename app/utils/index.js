const CryptoUtils = require('./crypto-utils');

module.exports = {
  randomBytes:    CryptoUtils.randomBytes,
  randomHash:     CryptoUtils.randomHash,
  SHA256:         CryptoUtils.SHA256,
  SHA512:         CryptoUtils.SHA512,
  hashUserToken:  CryptoUtils.hashUserToken,
};
