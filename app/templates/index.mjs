'use strict';

const {
  // Master
  MasterEmailTemplate,

  // Auth
  AuthSignInEmailTemplate,
  AuthSignUpEmailTemplate,

  // Org
  OrgUserInvitationEmailTemplate,
  OrgUserRemovedEmailTemplate,
  OrgUserRolesUpdatedEmailTemplate,
} = require('./email');

module.exports = {
  email: {
    // Master
    MasterEmailTemplate,

    // Auth
    AuthSignInEmailTemplate,
    AuthSignUpEmailTemplate,

    // Org
    OrgUserInvitationEmailTemplate,
    OrgUserRemovedEmailTemplate,
    OrgUserRolesUpdatedEmailTemplate,
  },
};
