'use strict';

const MasterEmailTemplate = require('./master-template');
const AuthTemplates       = require('./auth');
const OrgTemplates        = require('./org');

const {
  AuthSignInEmailTemplate,
  AuthSignUpEmailTemplate,
} = AuthTemplates;

const {
  OrgUserInvitationEmailTemplate,
  OrgUserRemovedEmailTemplate,
  OrgUserRolesUpdatedEmailTemplate,
} = OrgTemplates;

module.exports = {
  // Master
  MasterEmailTemplate,

  // Auth
  AuthSignInEmailTemplate,
  AuthSignUpEmailTemplate,

  // Org
  OrgUserInvitationEmailTemplate,
  OrgUserRemovedEmailTemplate,
  OrgUserRolesUpdatedEmailTemplate,
};
