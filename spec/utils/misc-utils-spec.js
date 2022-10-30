/* eslint-disable no-magic-numbers */

'use strict';

/* global describe, it, expect, beforeAll, afterEach, afterAll */

const Utils = require('../../app/utils');
const {
  createTestApplication,
  createFactories,
  createRunners,
} = require('../support/application');

describe('misc-utils', () => {
  describe('isHumanFriendlyID', () => {
    it('should be able to detect a human friendly ID', () => {
      expect(Utils.isHumanFriendlyID('aaaa')).toEqual(true);
      expect(Utils.isHumanFriendlyID('aaab')).toEqual(true);
      expect(Utils.isHumanFriendlyID('aaaa')).toEqual(true);
      expect(Utils.isHumanFriendlyID('aaba')).toEqual(true);
      expect(Utils.isHumanFriendlyID('wwwwwwwwwwwww')).toEqual(true);
      expect(Utils.isHumanFriendlyID('z')).toEqual(false);
      expect(Utils.isHumanFriendlyID('zzzz')).toEqual(false);
      expect(Utils.isHumanFriendlyID('aaai')).toEqual(false);
      expect(Utils.isHumanFriendlyID('wwwwwwwwwwwwww')).toEqual(false);
    });
  });

  describe('numberToHumanFriendlyID', () => {
    it('should be able to convert a number into a human friendly ID', () => {
      expect(Utils.numberToHumanFriendlyID(0)).toEqual('aaaa');
      expect(Utils.numberToHumanFriendlyID(1)).toEqual('aaab');
      expect(Utils.numberToHumanFriendlyID(15)).toEqual('aaaw');
      expect(Utils.numberToHumanFriendlyID(16)).toEqual('aaba');
    });

    it('should be able to convert a human friendly ID into a number', () => {
      expect(Utils.humanFriendlyIDToNumber('aaaa')).toEqual(0);
      expect(Utils.humanFriendlyIDToNumber('aaab')).toEqual(1);
      expect(Utils.humanFriendlyIDToNumber('aaaw')).toEqual(15);
      expect(Utils.humanFriendlyIDToNumber('aaba')).toEqual(16);
    });

    it('should convert back and forth', () => {
      // Sequential sample
      for (let i = 0; i < 10000; i++) {
        let id  = Utils.numberToHumanFriendlyID(i);
        let num = Utils.humanFriendlyIDToNumber(id);

        expect(id).toBeInstanceOf(String);
        expect(num).toEqual(i);
      }

      // Random sample
      for (let i = 0; i < 10000; i++) {
        // One bit less than Number.MAX_SAFE_INTEGER
        let input = Math.floor(4503599627370495 * Math.random());
        let id    = Utils.numberToHumanFriendlyID(input);
        let num   = Utils.humanFriendlyIDToNumber(id);

        expect(id).toBeInstanceOf(String);
        expect(num).toEqual(input);
      }
    });
  });

  describe('sanitizeHTML', () => {
    it('should be able to sanitize an HTML string', () => {
      const evilContent = '<script>var malice = true;</script><embed type="image/jpg"><object>Hacking</object><iframe>Foreign content</iframe><style>.malice { color: red }</style>';
      expect(Utils.sanitizeHTML(`<span>Test</span>${evilContent}`)).toEqual('<span>Test</span>');
    });
  });

  describe('parseMentions', () => {
    it('should be able to parse mentions', () => {
      const user1Mention = Utils.generateRawMentionTagForUser({
        id:         'USR_798f0746-310c-4c2e-a033-dc20d79a911b',
        firstName:  'Amanda',
        lastName:   'Hijacker',
      });

      const user2Mention = Utils.generateRawMentionTagForUser({
        id:         'USR_fb9e7613-c063-41ee-8ccc-14f0d3cc59e5',
        firstName:  'Joe',
        lastName:   'Brown',
      });

      const content = `<p>Hello ${user1Mention}, user ${user2Mention} said that you need some help. Is that true ${user1Mention}?</p>`;
      expect(Utils.parseMentions(content)).toEqual({
        'USR_798f0746-310c-4c2e-a033-dc20d79a911b': 2,
        'USR_fb9e7613-c063-41ee-8ccc-14f0d3cc59e5': 1,
      });
    });
  });

  describe('encodeHTMLEntities', () => {
    it('should be able to encode entities', () => {
      let content = Utils.encodeHTMLEntities('&amp; 😊 🙂 🎁 testing 🤣 &#x43; <stuff> "things" wow! &#67;');
      expect(content).toEqual('&amp; &#128522; &#128578; &#127873; testing &#129315; &#x43; &#60;stuff&#62; &#34;things&#34; wow! &#67;');
    });
  });

  describe('rehydrateMentions', () => {
    let app;
    let models;
    let factory;

    // eslint-disable-next-line no-unused-vars
    const { it, fit } = createRunners(() => app.getDBConnection());

    beforeAll(async () => {
      app = await createTestApplication();
      factory = createFactories(app);
      models = app.getModels();
    });

    afterAll(async () => {
      await app.stop();
    });

    afterEach(async () => {
      factory.reset();
      await app.truncateAllTables();
    });

    it('should be able to rehydrate mentions when user info changes', async () => {
      let { user: user1, organization } = await factory.users.createWithOrganization({
        userData: {
          id:         'USR_cd08vheqqwpgbh6yqp60',
          firstName:  'Amanda',
          lastName:   'Hijacker',
        },
      });

      let { user: user2 } = await factory.users.create({
        data: {
          id:         'USR_cd08qzqqqwpgbh6yqp50',
          firstName:  'Joe',
          lastName:   'Brown',
        },
        organization,
      });

      const user1Mention = Utils.generateRawMentionTagForUser(user1);
      const user2Mention = Utils.generateRawMentionTagForUser(user2);

      const content = `<p>Hello ${user1Mention}, user ${user2Mention} said that you need some help. Is that true ${user1Mention}?</p>`;
      expect(content).toEqual('<p>Hello <span class="mention" data-denotation-char="@" data-id="USR_cd08vheqqwpgbh6yqp60" data-value="Amanda Hijacker"><span contenteditable="false"><span class="ql-mention-denotation-char">@</span>Amanda Hijacker</span></span>, user <span class="mention" data-denotation-char="@" data-id="USR_cd08qzqqqwpgbh6yqp50" data-value="Joe Brown"><span contenteditable="false"><span class="ql-mention-denotation-char">@</span>Joe Brown</span></span> said that you need some help. Is that true <span class="mention" data-denotation-char="@" data-id="USR_cd08vheqqwpgbh6yqp60" data-value="Amanda Hijacker"><span contenteditable="false"><span class="ql-mention-denotation-char">@</span>Amanda Hijacker</span></span>?</p>');

      await models.OrganizationUserLink.create({
        organizationID: organization.id,
        userID:         user1.id,
        firstName:      'Amanda',
        lastName:       'Crazzin',
      });

      await models.OrganizationUserLink.create({
        organizationID: organization.id,
        userID:         user2.id,
        firstName:      'Joseph',
        lastName:       'Tan',
      });

      let newContent = await Utils.rehydrateMentions(models, organization.id, content);
      expect(newContent).toEqual('<p>Hello <span class="mention" data-denotation-char="@" data-id="USR_cd08vheqqwpgbh6yqp60" data-value="Amanda Crazzin"><span contenteditable="false"><span class="ql-mention-denotation-char">@</span>Amanda Crazzin</span></span>, user <span class="mention" data-denotation-char="@" data-id="USR_cd08qzqqqwpgbh6yqp50" data-value="Joseph Tan"><span contenteditable="false"><span class="ql-mention-denotation-char">@</span>Joseph Tan</span></span> said that you need some help. Is that true <span class="mention" data-denotation-char="@" data-id="USR_cd08vheqqwpgbh6yqp60" data-value="Amanda Crazzin"><span contenteditable="false"><span class="ql-mention-denotation-char">@</span>Amanda Crazzin</span></span>?</p>');
    });
  });
});
