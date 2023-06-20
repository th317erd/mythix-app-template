'use strict';

import MasterEmailTemplate from './master-template.js';
import AuthTemplates from './auth.js';
import OrgTemplates from './org.js';

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
