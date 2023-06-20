'use strict';

import OrgBaseTemplate from './org-template-base.js';

// NOTE: This template is unused for Beta

class OrgUserRemovedEmailTemplate extends OrgBaseTemplate {
  generateSubject() {
    return this.langTerm('email.auth.signIn.subject', '<<<APP_DISPLAY_NAME>>> Magic Login Link');
  }

  async render() {
    let {
      initiatingUser,
      organization,
    } = this.getData();

    // TODO: @I18N
    return await super.render([
      this.text(
        // TODO: @I18N
        `<b>${initiatingUser.email}</b> has removed you from the <b>${organization.name}</b> <<<APP_DISPLAY_NAME>>> Organization. You no longer have access to this organization or any of its content.`,
      ),
    ]);
  }
}

module.exports = OrgUserRemovedEmailTemplate;
