'use strict';

const Nife  = require('nife');
const xid   = require('xid-js');

const BASE_ID_LENGTH      = 20;
const PREFIXED_XID_REGEXP = /^[A-Z]{3}_[0-9abcdefghjkmnpqrstvwxyz]{20}$/;

const MODEL_ID_PREFIXES = {
  'InvalidToken':                 'IVT_',
  'ModelMeta':                    'MOM_',
  'Notification':                 'NTF_',
  'Organization':                 'ORG_',
  'OrganizationUserLink':         'OUL_',
  'Role':                         'ROL_',
  'Tag':                          'TAG_',
  'User':                         'USR_',
};

const ID_PREFIX_TO_MODEL_NAME = Object.keys(MODEL_ID_PREFIXES).reduce((obj, modelName) => {
  let prefix = MODEL_ID_PREFIXES[modelName];
  obj[prefix] = modelName;
  return obj;
}, {});

function XID() {
  return xid.next();
}

function isValidID(value, modelName) {
  if (!value)
    return false;

  if (modelName) {
    let prefixModelName = getModelNameFromIDPrefix(value);
    if (prefixModelName !== modelName)
      return false;
  }

  return PREFIXED_XID_REGEXP.test(value);
}

function getModelIDPrefixFor(modelName) {
  let prefix = MODEL_ID_PREFIXES[modelName];
  if (prefix == null)
    throw new Error(`getModelIDPrefixFor: No prefix found for model "${modelName}".`);

  return prefix;
}

function getModelNameFromIDPrefix(id) {
  if (!Nife.instanceOf(id, 'string'))
    return;

  // eslint-disable-next-line no-magic-numbers
  let prefix = id.substring(0, 4);
  return ID_PREFIX_TO_MODEL_NAME[prefix];
}

function getModelTypeAndIDFromID(id) {
  return {
    type: getModelNameFromIDPrefix(id),
    id,
  };
}

function stripIDPrefix(value) {
  if (!Nife.instanceOf(value, 'string'))
    return { prefix: '', id: false };

  let valueLen    = value.length;
  if (valueLen > BASE_ID_LENGTH) {
    let diff = valueLen - BASE_ID_LENGTH;
    return { prefix: value.substring(0, diff), id: value.substring(diff) };
  }

  return { prefix: '', id: value };
}

function addIDPrefix(modelName, value) {
  if (!Nife.instanceOf(value, 'string'))
    return value;

  if (value > BASE_ID_LENGTH)
    return value;

  let { id } = stripIDPrefix(value);
  return `${getModelIDPrefixFor(modelName)}${id}`;
}

module.exports = {
  XID,
  isValidID,
  getModelIDPrefixFor,
  getModelNameFromIDPrefix,
  getModelTypeAndIDFromID,
  stripIDPrefix,
  addIDPrefix,
};
