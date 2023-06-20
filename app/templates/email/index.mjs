'use strict';

import MasterEmailTemplate from './master-template.mjs';
import AuthTemplates from './auth.mjs';
import OrgTemplates from './org.mjs';

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
