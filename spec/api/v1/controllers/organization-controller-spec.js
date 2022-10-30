/* eslint-disable max-classes-per-file */
/* eslint-disable no-magic-numbers */
'use strict';

/* global describe, beforeAll, afterAll, afterEach, expect, jasmine, __dirname, spyOn, Buffer */

const Path = require('node:path');
const FileSystem = require('node:fs');
const FormData = require('form-data');
const Utils = require('../../../../app/utils');
const {
  createTestApplication,
  createFactories,
  createRunners,
  PREFIXED_XID_REGEXP,
} = require('../../../support/application');

describe('OrganizationController', function() {
  let app;
  let factory;
  let models;

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

    app.setDefaultHeader('Authorization', undefined);
    app.setDefaultHeader('X-Organization-ID', undefined);

    jasmine.clock().uninstall();
    await app.truncateAllTables();
  });

  const fetchValues = (args) => args;

  describe('create', () => {
    it('should fail if user is not logged in', async () => {
      let result = await app.put('/api/v1/organization/');
      expect(result.statusCode).toEqual(401);
      expect(result.body).toEqual('Unauthorized');
    });

    it('should fail if unable to save model', async () => {
      await factory.users.createAndLogin({ userRole: 'masteradmin' });

      await app.hijackModel(
        'Organization',
        (Organization) => {
          return class TestOrganization extends Organization {
            static create() {
              throw new Error('Failed!');
            }
          };
        },
        // runner
        async () => {
          let result = await app.put('/api/v1/organization/', { data: { name: 'Derp' } });
          expect(result.statusCode).toEqual(500);
          expect(result.body).toEqual('Failed to create organization');
        },
      );
    });

    it('should fail if user is a member', async () => {
      await factory.users.createAndLogin(async (args) => {
        return args;
      });

      let result = await app.put('/api/v1/organization/', { data: { name: 'Derp' } });
      expect(result.statusCode).toEqual(403);
      expect(result.body).toEqual('Forbidden');
    });

    it('should fail if user is an admin', async () => {
      await factory.users.createAndLogin({ userRole: 'admin' });

      let result = await app.put('/api/v1/organization/', { data: { name: 'Derp' } });
      expect(result.statusCode).toEqual(403);
      expect(result.body).toEqual('Forbidden');
    });

    it('should fail if user is a superadmin', async () => {
      await factory.users.createAndLogin({ userRole: 'superadmin' });

      let result = await app.put('/api/v1/organization/', { data: { name: 'Derp' } });
      expect(result.statusCode).toEqual(403);
      expect(result.body).toEqual('Forbidden');
    });

    it('should succeed if user is a support user', async () => {
      await factory.users.createAndLogin({ userRole: 'support' });

      let result = await app.put('/api/v1/organization/', { data: { name: 'Derp' } });
      expect(result.statusCode).toEqual(200);

      let data = result.body.data;
      expect(data.id).toMatch(PREFIXED_XID_REGEXP);
      expect(data.name).toEqual('Derp');
    });

    it('should succeed if user is a masteradmin', async () => {
      await factory.users.createAndLogin({ userRole: 'masteradmin' });

      let result = await app.put('/api/v1/organization/', { data: { name: 'Derp' } });
      expect(result.statusCode).toEqual(200);

      let data = result.body.data;
      expect(data.id).toMatch(PREFIXED_XID_REGEXP);
      expect(data.name).toEqual('Derp');
    });
  });

  describe('update', () => {
    const generateTests = (method) => {
      describe(method.toUpperCase(), () => {
        it('should fail if user is not logged in', async () => {
          let result = await app[method]('/api/v1/organization/update');
          expect(result.statusCode).toEqual(401);
          expect(result.body).toEqual('Unauthorized');
        });

        it('should fail if bad organization id supplied', async () => {
          await factory.users.createAndLogin({ userRole: 'superadmin' });

          let result = await app[method]('/api/v1/organization/derp', { data: { name: 'Derp' } });
          expect(result.statusCode).toEqual(400);
          expect(result.body).toEqual('"organizationID" parameter required');
        });

        it('should fail if organization not found', async () => {
          await factory.users.createAndLogin({ userRole: 'superadmin' });

          let result = await app[method]('/api/v1/organization/ORG_cd08tmtqqwpgbh6yqp5g', { data: { name: 'Derp' } });
          expect(result.statusCode).toEqual(404);
          expect(result.body).toEqual('Organization not found');
        });

        it('should fail if unable to save model', async () => {
          let { organization } = await factory.users.createAndLogin({ userRole: 'superadmin' });

          await app.hijackModel(
            'Organization',
            (Organization) => {
              return class TestOrganization extends Organization {
                constructor(...args) {
                  super(...args);

                  // Force bad save
                  this.save = async function() {
                    throw new Error('Failed!');
                  };
                }
              };
            },
            // runner
            async () => {
              let result = await app[method](`/api/v1/organization/${organization.id}`, { data: { name: 'Derp' } });
              expect(result.statusCode).toEqual(500);
              expect(result.body).toEqual('Failed to update organization');
            },
          );
        });

        it('should fail if user is not superadmin level or higher (as member)', async () => {
          let { organization } = await factory.users.createAndLogin(async (args) => args);

          let result = await app[method](`/api/v1/organization/${organization.id}`, { data: { name: 'Test' } });
          expect(result.statusCode).toEqual(403);
          expect(result.body).toEqual('Forbidden');
        });

        it('should fail if user is not superadmin level or higher (as admin)', async () => {
          let { organization } = await factory.users.createAndLogin({ userRole: 'admin' });

          let result = await app[method](`/api/v1/organization/${organization.id}`, { data: { name: 'Test' } });
          expect(result.statusCode).toEqual(403);
          expect(result.body).toEqual('Forbidden');
        });

        it('should succeed if user is a superadmin', async () => {
          let { organization } = await factory.users.createAndLogin({ userRole: 'superadmin' });

          expect(organization.name).toBe('Test');

          let result = await app[method](`/api/v1/organization/${organization.id}`, { data: { name: 'Derp' } });
          expect(result.statusCode).toEqual(200);

          let data = result.body.data;
          expect(data.id).toMatch(organization.id);
          expect(data.name).toEqual('Derp');

          // Reload to ensure the update was persisted
          organization = await models.Organization.$.id.EQ(organization.id).first();
          expect(data.name).toEqual('Derp');
        });

        it('should succeed if user is a support user', async () => {
          let { organization } = await factory.users.createAndLogin({ userRole: 'support' });

          expect(organization.name).toBe('Test');

          let result = await app[method](`/api/v1/organization/${organization.id}`, { data: { name: 'Derp' } });
          expect(result.statusCode).toEqual(200);

          let data = result.body.data;
          expect(data.id).toMatch(organization.id);
          expect(data.name).toEqual('Derp');
        });

        it('should succeed if user is a masteradmin', async () => {
          let { organization } = await factory.users.createAndLogin({ userRole: 'masteradmin' });

          expect(organization.name).toBe('Test');

          let result = await app[method](`/api/v1/organization/${organization.id}`, { data: { name: 'Derp' } });
          expect(result.statusCode).toEqual(200);

          let data = result.body.data;
          expect(data.id).toMatch(organization.id);
          expect(data.name).toEqual('Derp');
        });
      });
    };

    const methods = [ 'post', 'patch' ];
    for (let i = 0, il = methods.length; i < il; i++) {
      let method = methods[i];
      generateTests(method);
    }
  });

  describe('inviteUser', () => {
    it('should fail if user is not logged in', async () => {
      let { organization } = await factory.organizations.create();

      let result = await app.post(`/api/v1/organization/${organization.id}/inviteUser`);
      expect(result.statusCode).toEqual(401);
      expect(result.body).toEqual('Unauthorized');
    });

    it('should fail if user targets a organization they are not a member of (as a member)', async () => {
      let { organization } = await factory.organizations.create();

      await factory.users.createAndLogin();

      let result = await app.post(`/api/v1/organization/${organization.id}/inviteUser`);
      expect(result.statusCode).toEqual(403);
      expect(result.body).toEqual('Forbidden');
    });

    it('should fail if user is not allowed to invite a user to the organization (as member)', async () => {
      let { organization } = await factory.users.createAndLogin(fetchValues);

      let result = await app.post(`/api/v1/organization/${organization.id}/inviteUser`);
      expect(result.statusCode).toEqual(403);
      expect(result.body).toEqual('Forbidden');
    });

    it('should fail with a bad request if user did not supply an email address (as member)', async () => {
      let { user, organization } = await factory.users.createAndLogin(fetchValues);
      await models.Role.createFor(user, 'invite-to-organization', organization);

      let result = await app.post(`/api/v1/organization/${organization.id}/inviteUser`, { data: {} });
      expect(result.statusCode).toEqual(400);
      expect(result.body).toEqual('"email" is required');
    });

    it('should succeed creating a user (as member)', async () => {
      let { user, organization } = await factory.users.createAndLogin(fetchValues);
      await models.Role.createFor(user, 'invite-to-organization', organization);

      let result = await app.post(`/api/v1/organization/${organization.id}/inviteUser`, { data: { email: 'test+user@example.com' } });
      expect(result.statusCode).toEqual(200);

      let data = result.body.data;
      expect(data.status).toEqual('created');
      expect(data.organizationID).toEqual(organization.id);
      expect(data.userID).toMatch(PREFIXED_XID_REGEXP);
      expect(data.addedRoles).toEqual([ 'member' ]);
    });

    it('should succeed modifying a user (as member)', async () => {
      let { user, organization } = await factory.users.createAndLogin(fetchValues);
      await models.Role.createFor(user, 'invite-to-organization', organization);

      let { user: otherUser } = await factory.users.createWithOrganization({ userData: { email: 'test+user@example.com' } });

      let result = await app.post(`/api/v1/organization/${organization.id}/inviteUser`, { data: { email: otherUser.email } });
      expect(result.statusCode).toEqual(200);

      let data = result.body.data;
      expect(data.status).toEqual('modified');
      expect(data.organizationID).toEqual(organization.id);
      expect(data.userID).toEqual(otherUser.id);
      expect(data.addedRoles).toEqual([ 'member' ]);
    });

    it('should succeed not modifying a user (as member)', async () => {
      let { user, organization } = await factory.users.createAndLogin(fetchValues);
      await models.Role.createFor(user, 'invite-to-organization', organization);

      let { user: otherUser } = await factory.users.createWithOrganization({ userData: { email: 'test+user@example.com' }, organization });

      let result = await app.post(`/api/v1/organization/${organization.id}/inviteUser`, { data: { email: otherUser.email } });
      expect(result.statusCode).toEqual(201);

      let data = result.body.data;
      expect(data.status).toEqual('not-modified');
      expect(data.organizationID).toEqual(organization.id);
      expect(data.userID).toEqual(otherUser.id);
    });

    it('should do nothing if requesting roles user has no access to (as member)', async () => {
      let { user, organization } = await factory.users.createAndLogin(fetchValues);
      await models.Role.createFor(user, 'invite-to-organization', organization);

      let { user: otherUser } = await factory.users.createWithOrganization({ userData: { email: 'test+user@example.com' }, organization });

      let result = await app.post(`/api/v1/organization/${organization.id}/inviteUser`, { data: { email: otherUser.email, roles: [ 'superadmin', 'masteradmin', 'admin', 'support' ] } });
      expect(result.statusCode).toEqual(201);

      let data = result.body.data;
      expect(data.status).toEqual('not-modified');
      expect(data.organizationID).toEqual(organization.id);
      expect(data.userID).toEqual(otherUser.id);
    });

    it('should add user roles as requested (as admin)', async () => {
      let { user, organization } = await factory.users.createAndLogin({ userRole: 'admin' });
      await models.Role.createFor(user, 'invite-to-organization', organization);

      let { user: otherUser } = await factory.users.create({ data: { email: 'user+to+invite@example.com' } });

      let result = await app.post(`/api/v1/organization/${organization.id}/inviteUser`, { data: { email: otherUser.email, roles: [ 'superadmin', 'masteradmin', 'admin', 'support' ] } });
      expect(result.statusCode).toEqual(200);

      let data = result.body.data;
      expect(data.status).toEqual('modified');
      expect(data.organizationID).toEqual(organization.id);
      expect(data.userID).toEqual(otherUser.id);
      expect(data.addedRoles).toEqual([ 'admin' ]);
    });
  });

  describe('removeUser', () => {
    it('should fail if user is not logged in', async () => {
      let { organization } = await factory.organizations.create();
      let { user } = await factory.users.create({ organization });

      let result = await app.delete(`/api/v1/organization/${organization.id}/user/${user.id}`);
      expect(result.statusCode).toEqual(401);
      expect(result.body).toEqual('Unauthorized');
    });

    it('should fail with a bad request if user supplies a bad userID', async () => {
      let { organization } = await factory.users.createAndLogin(fetchValues);

      let result = await app.delete(`/api/v1/organization/${organization.id}/user/derp`);
      expect(result.statusCode).toEqual(400);
      expect(result.body).toEqual('"userID" parameter required');
    });

    it('should fail with a 404 if user is not found', async () => {
      let { organization } = await factory.users.createAndLogin(fetchValues);

      let result = await app.delete(`/api/v1/organization/${organization.id}/user/USR_cd08vheqqwpgbh6yqp60`);
      expect(result.statusCode).toEqual(404);
      expect(result.body).toEqual('User not found');
    });

    describe('as a member', () => {
      it('should fail if user targets a organization they are not a member of', async () => {
        let { organization } = await factory.organizations.create();

        await factory.users.createAndLogin();

        let { user: userToRemove } = await factory.users.createWithOrganization({ userData: { email: 'remove+user@example.com' } });

        let result = await app.delete(`/api/v1/organization/${organization.id}/user/${userToRemove.id}`);
        expect(result.statusCode).toEqual(403);
        expect(result.body).toEqual('Forbidden');
      });

      it('should fail if user is not allowed to remove a user from the organization', async () => {
        let { organization } = await factory.users.createAndLogin(fetchValues);

        let { user: userToRemove } = await factory.users.create({ data: { email: 'remove+user@example.com' }, organization });

        let result = await app.delete(`/api/v1/organization/${organization.id}/user/${userToRemove.id}`);
        expect(result.statusCode).toEqual(403);
        expect(result.body).toEqual('Forbidden');
      });
    });

    describe('as an admin', () => {
      it('should fail if user targets a organization they are not a member of', async () => {
        let { organization } = await factory.users.createAndLogin({ userRole: 'admin' });

        let { user: userToRemove } = await factory.users.createWithOrganization({ userData: { email: 'remove+user@example.com' } });

        let result = await app.delete(`/api/v1/organization/${organization.id}/user/${userToRemove.id}`);
        expect(result.statusCode).toEqual(403);
        expect(result.body).toEqual('Forbidden');
      });

      it('should fail if user is not allowed to remove a user from the organization', async () => {
        let { organization } = await factory.users.createAndLogin({ userRole: 'admin' });

        let { user: adminUser } = await factory.users.create({ data: { email: 'admin+user@example.com' }, organization, userRole: 'admin' });
        let { user: superAdminUser } = await factory.users.create({ data: { email: 'superadmin+user@example.com' }, organization, userRole: 'superadmin' });
        let { user: supportUser } = await factory.users.create({ data: { email: 'support+user@example.com' }, organization, userRole: 'support' });
        let { user: masterAdminUser } = await factory.users.create({ data: { email: 'masteradmin+user@example.com' }, organization, userRole: 'masteradmin' });

        let result = await app.delete(`/api/v1/organization/${organization.id}/user/${adminUser.id}`);
        expect(result.statusCode).toEqual(403);
        expect(result.body).toEqual('Forbidden');

        result = await app.delete(`/api/v1/organization/${organization.id}/user/${superAdminUser.id}`);
        expect(result.statusCode).toEqual(403);
        expect(result.body).toEqual('Forbidden');

        result = await app.delete(`/api/v1/organization/${organization.id}/user/${supportUser.id}`);
        expect(result.statusCode).toEqual(403);
        expect(result.body).toEqual('Forbidden');

        result = await app.delete(`/api/v1/organization/${organization.id}/user/${masterAdminUser.id}`);
        expect(result.statusCode).toEqual(403);
        expect(result.body).toEqual('Forbidden');
      });

      it('should succeed for a member of the same organization', async () => {
        let { organization } = await factory.users.createAndLogin({ userRole: 'admin'});

        let { user: userToRemove } = await factory.users.createWithOrganization({ userData: { email: 'remove+user@example.com' }, organization });

        let roles = await userToRemove.getRolesFor(organization);
        expect(roles).toBeInstanceOf(Array);
        expect(roles.length).toEqual(1);

        let result = await app.delete(`/api/v1/organization/${organization.id}/user/${userToRemove.id}`);
        expect(result.statusCode).toEqual(200);
        expect(result.body.data).toEqual({
          status:         'removed',
          organizationID: organization.id,
          userID:         userToRemove.id,
        });

        roles = await userToRemove.getRolesFor(organization);
        expect(roles).toBeInstanceOf(Array);
        expect(roles.length).toEqual(0);
      });
    });

    describe('as a superadmin', () => {
      it('should fail if user targets a organization they are not a member of', async () => {
        let { organization } = await factory.users.createAndLogin({ userRole: 'superadmin' });

        let { user: userToRemove } = await factory.users.createWithOrganization({ userData: { email: 'remove+user@example.com' } });

        let result = await app.delete(`/api/v1/organization/${organization.id}/user/${userToRemove.id}`);
        expect(result.statusCode).toEqual(403);
        expect(result.body).toEqual('Forbidden');
      });

      it('should fail if user is not allowed to remove a user from the organization', async () => {
        let { organization } = await factory.users.createAndLogin({ userRole: 'superadmin' });

        let { user: adminUser } = await factory.users.create({ data: { email: 'admin+user@example.com' }, organization, userRole: 'admin' });
        let { user: superAdminUser } = await factory.users.create({ data: { email: 'superadmin+user@example.com' }, organization, userRole: 'superadmin' });
        let { user: supportUser } = await factory.users.create({ data: { email: 'support+user@example.com' }, organization, userRole: 'support' });
        let { user: masterAdminUser } = await factory.users.create({ data: { email: 'masteradmin+user@example.com' }, organization, userRole: 'masteradmin' });

        let result = await app.delete(`/api/v1/organization/${organization.id}/user/${adminUser.id}`);
        expect(result.statusCode).toEqual(200);

        result = await app.delete(`/api/v1/organization/${organization.id}/user/${superAdminUser.id}`);
        expect(result.statusCode).toEqual(403);

        result = await app.delete(`/api/v1/organization/${organization.id}/user/${supportUser.id}`);
        expect(result.statusCode).toEqual(403);
        expect(result.body).toEqual('Forbidden');

        result = await app.delete(`/api/v1/organization/${organization.id}/user/${masterAdminUser.id}`);
        expect(result.statusCode).toEqual(403);
        expect(result.body).toEqual('Forbidden');
      });

      it('should succeed for a member of the same organization', async () => {
        let { organization } = await factory.users.createAndLogin({ userRole: 'superadmin' });

        let { user: userToRemove } = await factory.users.createWithOrganization({ userData: { email: 'remove+user@example.com' }, organization });

        let roles = await userToRemove.getRolesFor(organization);
        expect(roles).toBeInstanceOf(Array);
        expect(roles.length).toEqual(1);

        let result = await app.delete(`/api/v1/organization/${organization.id}/user/${userToRemove.id}`);
        expect(result.statusCode).toEqual(200);
        expect(result.body.data).toEqual({
          status:         'removed',
          organizationID: organization.id,
          userID:         userToRemove.id,
        });

        roles = await userToRemove.getRolesFor(organization);
        expect(roles).toBeInstanceOf(Array);
        expect(roles.length).toEqual(0);
      });
    });
  });

  describe('show', () => {
    it('should fail if user is not logged in', async () => {
      let { organization } = await factory.organizations.create();

      let result = await app.get(`/api/v1/organization/${organization.id}`);
      expect(result.statusCode).toEqual(401);
      expect(result.body).toEqual('Unauthorized');
    });

    it('should fail if user targets a organization they are not a member of (as a member)', async () => {
      let { organization } = await factory.organizations.create();

      await factory.users.createAndLogin();

      let result = await app.get(`/api/v1/organization/${organization.id}`);
      expect(result.statusCode).toEqual(403);
      expect(result.body).toEqual('Forbidden');
    });

    it('should succeed user targets a organization they are a member of (as a member)', async () => {
      let { organization } = await factory.users.createAndLogin();

      let result = await app.get(`/api/v1/organization/${organization.id}`);
      expect(result.statusCode).toEqual(200);
      expect(result.body.data.id).toEqual(organization.id);
    });

    it('should fail if user targets a organization they are not a member of (as an admin)', async () => {
      let { organization } = await factory.organizations.create();

      await factory.users.createAndLogin({ userRole: 'admin' });

      let result = await app.get(`/api/v1/organization/${organization.id}`);
      expect(result.statusCode).toEqual(403);
      expect(result.body).toEqual('Forbidden');
    });

    it('should succeed user targets a organization they are a member of (as an admin)', async () => {
      let { organization } = await factory.organizations.create();

      let { user } = await factory.users.createAndLogin({ userRole: 'admin' });
      await organization.addUser(user, { userRole: 'admin' });

      let result = await app.get(`/api/v1/organization/${organization.id}`);
      expect(result.statusCode).toEqual(200);
      expect(result.body.data.id).toEqual(organization.id);
    });

    it('should fail if user targets a organization they are not a member of (as a superadmin)', async () => {
      let { organization } = await factory.organizations.create();

      await factory.users.createAndLogin({ userRole: 'superadmin' });

      let result = await app.get(`/api/v1/organization/${organization.id}`);
      expect(result.statusCode).toEqual(403);
      expect(result.body).toEqual('Forbidden');
    });

    it('should succeed user targets a organization they are a member of (as a superadmin)', async () => {
      let { organization } = await factory.organizations.create();

      let { user } = await factory.users.createAndLogin(async (args) => args);
      await organization.addUser(user, { userRole: 'superadmin' });

      let result = await app.get(`/api/v1/organization/${organization.id}`);
      expect(result.statusCode).toEqual(200);
      expect(result.body.data.id).toEqual(organization.id);
    });

    it('should succeed user targets a organization they are not a member of (as a support user)', async () => {
      let { organization } = await factory.organizations.create();

      await factory.users.createAndLogin({ userRole: 'support' });

      let result = await app.get(`/api/v1/organization/${organization.id}`);
      expect(result.statusCode).toEqual(200);
      expect(result.body.data.id).toEqual(organization.id);
    });

    it('should succeed user targets a organization they are not a member of (as a masteradmin)', async () => {
      let { organization } = await factory.organizations.create();

      await factory.users.createAndLogin({ userRole: 'masteradmin' });

      let result = await app.get(`/api/v1/organization/${organization.id}`);
      expect(result.statusCode).toEqual(200);
      expect(result.body.data.id).toEqual(organization.id);
    });
  });

  describe('list', () => {
    it('should fail if user is not logged in', async () => {
      let result = await app.get('/api/v1/organization/');
      expect(result.statusCode).toEqual(401);
      expect(result.body).toEqual('Unauthorized');
    });

    it('should fail if unable to fetch organizations (Forbidden)', async () => {
      await factory.users.createAndLogin({ userRole: 'superadmin' });

      await app.hijackModel(
        'User',
        (User) => {
          return class TestUser extends User {
            constructor(...args) {
              super(...args);

              // Force bad fetch
              this.searchOrganizations = async function() {
                throw new Utils.ForbiddenError();
              };
            }
          };
        },
        // runner
        async () => {
          let result = await app.get('/api/v1/organization/');
          expect(result.statusCode).toEqual(403);
          expect(result.body).toEqual('Forbidden');
        },
      );
    });

    // For "superadmin", "admin", and "member" roles we should be able to
    // fetch only the organizations that we are part of
    const generateLowLevelRoleTests = (userRole) => {
      it(`should succeed, but only to get organizations user is a member of (as ${userRole})`, async () => {
        await factory.organizations.create({ data: { name: 'Org1' } });
        await factory.organizations.create({ data: { name: 'Org2' } });

        let { user, organization } = await factory.users.createAndLogin({ orgData: { name: 'UserOrg' }, userRole });

        let { organization: otherOrg } = await factory.organizations.create({ data: { name: 'OtherOrg' } });
        await otherOrg.addUser(user);

        expect(await models.OrganizationUserLink.count()).toEqual(2);

        let result = await app.get('/api/v1/organization/');
        expect(result.statusCode).toEqual(200);

        let data = result.body.data;
        expect(data).toBeInstanceOf(Array);
        expect(data.length).toEqual(2);
        expect(data[0].id).toEqual(otherOrg.id);
        expect(data[0].name).toEqual(otherOrg.name);
        expect(data[1].id).toEqual(organization.id);
        expect(data[1].name).toEqual(organization.name);
      });
    };

    const lowLevelRoles = [ 'member', 'admin', 'superadmin' ];
    for (let i = 0, il = lowLevelRoles.length; i < il; i++)
      generateLowLevelRoleTests(lowLevelRoles[i]);

    // For "masteradmin" and "support" roles we should be able to
    // fetch all organizations, not just organizations we are part of
    const generateHighLevelRoleTests = (userRole) => {
      it(`should succeed to get all organizations (as ${userRole})`, async () => {
        let { organization: org1 } = await factory.organizations.create({ data: { name: 'Org1' } });
        let { organization: org2 } = await factory.organizations.create({ data: { name: 'Org2' } });

        let { organization } = await factory.users.createAndLogin({ orgData: { name: 'UserOrg' }, userRole });

        let result = await app.get('/api/v1/organization/');
        expect(result.statusCode).toEqual(200);

        let data = result.body.data;
        expect(data).toBeInstanceOf(Array);
        expect(data.length).toEqual(3);
        expect(data[0].id).toEqual(org1.id);
        expect(data[0].name).toEqual(org1.name);
        expect(data[1].id).toEqual(org2.id);
        expect(data[1].name).toEqual(org2.name);
        expect(data[2].id).toEqual(organization.id);
        expect(data[2].name).toEqual(organization.name);
      });
    };

    const highLevelRoles = [ 'support', 'masteradmin' ];
    for (let i = 0, il = highLevelRoles.length; i < il; i++)
      generateHighLevelRoleTests(highLevelRoles[i]);
  });

  describe('searchTeamsAndUsers', () => {
    it('should fail if user is not logged in', async () => {
      let { organization } = await factory.users.createWithOrganization();

      let result = await app.post(`/api/v1/organization/${organization.id}/searchTeamsAndUsers`);
      expect(result.statusCode).toEqual(401);
      expect(result.body).toEqual('Unauthorized');
    });

    it('should succeed', async () => {
      let { user, organization } = await factory.users.createAndLogin();

      let { user: user1 } = await factory.users.create({
        data: {
          email:      'member+user1@example.com',
          firstName:  'User1',
          lastName:   'Member',
        },
        organization,
        userRole: 'member',
      });

      let { user: user2 } = await factory.users.create({
        data: {
          email:      'member+user2@example.com',
          firstName:  'User2',
          lastName:   'Member',
        },
        organization,
        userRole: 'member',
      });

      let { user: user3 } = await factory.users.create({
        data: {
          email:      'admin+user3@example.com',
          firstName:  'User3',
          lastName:   'Admin',
        },
        organization,
        userRole: 'admin',
      });

      let { user: user4 } = await factory.users.create({
        data: {
          email:      'superadmin+user4@example.com',
          firstName:  'User4',
          lastName:   'SuperAdmin',
        },
        organization,
        userRole: 'superadmin',
      });

      let { team: team1 } = await factory.teams.create({
        user,
        organization,
        data: {
          name:   'Team 1',
          emails: [
            user1.email,
            user2.email,
            user3.email,
          ],
        },
      });

      let { team: team2 } = await factory.teams.create({
        user,
        organization,
        data: {
          name:   'Team 2',
          emails: [
            user3.email,
            user4.email,
          ],
        },
      });

      let result = await app.post(`/api/v1/organization/${organization.id}/searchTeamsAndUsers`);
      expect(result.statusCode).toEqual(200);
      let data = result.body.data;

      expect(data.teams).toBeInstanceOf(Array);
      expect(data.teams.length).toEqual(2);
      expect(data.teams.map((team) => team.name)).toEqual([
        'Team 1',
        'Team 2',
      ]);

      expect(data.users).toBeInstanceOf(Array);
      expect(data.users.length).toEqual(4);
      expect(data.users.map((user) => user.email)).toEqual([
        'member+user1@example.com',
        'member+user2@example.com',
        'admin+user3@example.com',
        'superadmin+user4@example.com',
      ]);
      expect(data.users[0].teamIDs).toEqual([
        team1.id,
      ]);
      expect(data.users[1].teamIDs).toEqual([
        team1.id,
      ]);
      expect(data.users[2].teamIDs).toEqual([
        team1.id,
        team2.id,
      ]);

      // Should be able to filter on team name
      result = await app.post(`/api/v1/organization/${organization.id}/searchTeamsAndUsers`, {
        data: {
          filter: {
            teams: {
              name: 'Team 1',
            },
          },
        },
      });
      expect(result.statusCode).toEqual(200);
      data = result.body.data;

      expect(data.teams).toBeInstanceOf(Array);
      expect(data.teams.length).toEqual(1);
      expect(data.teams.map((team) => team.name)).toEqual([
        'Team 1',
      ]);

      expect(data.users).toBeInstanceOf(Array);
      expect(data.users.length).toEqual(3);
      expect(data.users.map((user) => user.email)).toEqual([
        'member+user1@example.com',
        'member+user2@example.com',
        'admin+user3@example.com',
      ]);
      expect(data.users[0].teamIDs).toEqual([
        team1.id,
      ]);
      expect(data.users[1].teamIDs).toEqual([
        team1.id,
      ]);
      expect(data.users[2].teamIDs).toEqual([
        team1.id,
      ]);

      // Should be able to filter on users
      result = await app.post(`/api/v1/organization/${organization.id}/searchTeamsAndUsers`, {
        data: {
          filter: {
            users: {
              lastName: 'SuperAdmin',
            },
          },
        },
      });
      expect(result.statusCode).toEqual(200);
      data = result.body.data;

      expect(data.teams).toBeInstanceOf(Array);
      expect(data.teams.length).toEqual(1);
      expect(data.teams.map((team) => team.name)).toEqual([
        'Team 2',
      ]);

      expect(data.users).toBeInstanceOf(Array);
      expect(data.users.length).toEqual(2);
      expect(data.users.map((user) => user.email)).toEqual([
        'admin+user3@example.com',
        'superadmin+user4@example.com',
      ]);
      expect(data.users[0].teamIDs).toEqual([
        team2.id,
      ]);
      expect(data.users[1].teamIDs).toEqual([
        team2.id,
      ]);
    });
  });

  describe('updateAvatar', () => {
    const testFilePath = Path.resolve(__dirname, '..', '..', '..', 'support', 'media', 'test.png');

    it('should fail if user is not logged in', async () => {
      let { user } = await factory.users.createWithOrganization();

      let result = await app.post(`/api/v1/organization/${user.getCurrentOrganizationID()}/user/${user.id}/updateUserAvatar`);
      expect(result.statusCode).toEqual(401);
      expect(result.body).toEqual('Unauthorized');
    });

    it('should be able to upload an avatar as application/json', async () => {
      let { user } = await factory.users.createAndLogin();

      let aws = app.getAWS();
      let fileName = Utils.MD5(`${user.id}:${user.getCurrentOrganizationID()}`);

      spyOn(aws, 'uploadToS3').and.callFake(async (options) => {
        expect(options.folder).toEqual('user-avatars');
        expect(options.fileName).toMatch(new RegExp(`${fileName}-\\d+\\.png`));
        expect(options.contentType).toEqual('image/png');

        return `https://<<<APP_NAME>>>.com/${options.folder}/${options.fileName}`;
      });

      let result = await app.post(`/api/v1/organization/${user.getCurrentOrganizationID()}/user/${user.id}/updateUserAvatar`, {
        data: {
          fileName: 'test.png',
          file:     FileSystem.readFileSync(testFilePath).toString('base64'),
        },
      });

      expect(result.statusCode).toEqual(200);

      let correctURL = `https://<<<APP_NAME>>>.com/user-avatars/${fileName}`;
      let data = result.body.data;
      expect(data.organizationID).toEqual(user.getCurrentOrganizationID());
      expect(data.baseURL).toEqual(correctURL);
      expect(data.urls).toBeInstanceOf(Array);
      expect(data.urls.length).toEqual(3);

      expect(aws.uploadToS3.calls.count()).toEqual(3);
      expect(Buffer.isBuffer(aws.uploadToS3.calls.argsFor(0)[0].content)).toEqual(true);
      expect(aws.uploadToS3.calls.argsFor(0)[0].content.length).toEqual(1221);
      expect(Buffer.isBuffer(aws.uploadToS3.calls.argsFor(1)[0].content)).toEqual(true);
      expect(aws.uploadToS3.calls.argsFor(1)[0].content.length).toEqual(8546);
      expect(Buffer.isBuffer(aws.uploadToS3.calls.argsFor(2)[0].content)).toEqual(true);
      expect(aws.uploadToS3.calls.argsFor(2)[0].content.length).toEqual(30919);

      let orgUserLink = await user.getOrganizationUserLink(user.getCurrentOrganizationID());
      expect(orgUserLink).toBeInstanceOf(models.OrganizationUserLink);

      expect(orgUserLink.userAvatarURL).toEqual(correctURL);
    });

    it('should be able to upload an avatar as multipart/form-data', async () => {
      let { user } = await factory.users.createAndLogin();

      let aws = app.getAWS();
      let fileName = Utils.MD5(`${user.id}:${user.getCurrentOrganizationID()}`);

      spyOn(aws, 'uploadToS3').and.callFake(async (options) => {
        expect(options.folder).toEqual('user-avatars');
        expect(options.fileName).toMatch(new RegExp(`${fileName}-\\d+\\.png`));
        expect(options.contentType).toEqual('image/png');

        return `https://<<<APP_NAME>>>.com/${options.folder}/${options.fileName}`;
      });

      let formData = new FormData();

      formData.append('file', FileSystem.createReadStream(testFilePath), 'test.png');

      let result = await app.post(`/api/v1/organization/${user.getCurrentOrganizationID()}/user/${user.id}/updateUserAvatar`, {
        data: formData,
      });

      expect(result.statusCode).toEqual(200);

      let correctURL = `https://<<<APP_NAME>>>.com/user-avatars/${fileName}`;
      let data = result.body.data;
      expect(data.organizationID).toEqual(user.getCurrentOrganizationID());
      expect(data.baseURL).toEqual(correctURL);
      expect(data.urls).toBeInstanceOf(Array);
      expect(data.urls.length).toEqual(3);

      expect(aws.uploadToS3.calls.count()).toEqual(3);
      expect(Buffer.isBuffer(aws.uploadToS3.calls.argsFor(0)[0].content)).toEqual(true);
      expect(aws.uploadToS3.calls.argsFor(0)[0].content.length).toEqual(1221);
      expect(Buffer.isBuffer(aws.uploadToS3.calls.argsFor(1)[0].content)).toEqual(true);
      expect(aws.uploadToS3.calls.argsFor(1)[0].content.length).toEqual(8546);
      expect(Buffer.isBuffer(aws.uploadToS3.calls.argsFor(2)[0].content)).toEqual(true);
      expect(aws.uploadToS3.calls.argsFor(2)[0].content.length).toEqual(30919);

      let orgUserLink = await user.getOrganizationUserLink(user.getCurrentOrganizationID());
      expect(orgUserLink).toBeInstanceOf(models.OrganizationUserLink);

      expect(orgUserLink.userAvatarURL).toEqual(correctURL);
    });
  });

  describe('updateUser', () => {
    const generateTests = (method) => {
      // Post and Patch should work identically
      describe(method.toUpperCase(), () => {
        it('should fail if user is not logged in', async () => {
          let { organization } = await factory.organizations.create();
          let result = await app[method](`/api/v1/organization/${organization.id}/user/test`);
          expect(result.statusCode).toEqual(401);
          expect(result.body).toEqual('Unauthorized');
        });

        it('should allow user to update themselves', async () => {
          let { user, organization } = await factory.users.createAndLogin(fetchValues);

          let result = await app[method](`/api/v1/organization/${organization.id}/user/${user.id}`, { data: { firstName: 'Johny', lastName: 'Bob', phone: '+1-555-555-5555' } });
          expect(result.statusCode).toEqual(200);

          let data = result.body.data;
          expect(data.email).toEqual('test1@example.com');
          expect(data.phone).toEqual('+1-555-555-5555');
          expect(data.firstName).toEqual('Johny');
          expect(data.lastName).toEqual('Bob');
          expect(data.dob).toEqual('2000-01-01'); // This can not be updated via the endpoint

          user = await models.User.$.id.EQ(user.id).first();
          expect(user.email).toEqual('test1@example.com');
          expect(user.phone).toEqual('15604520919');
          expect(user.firstName).toEqual('Test');
          expect(user.lastName).toEqual('User');
          expect(user.dob.toUTC().toFormat('yyyy-MM-dd')).toEqual('2000-01-01'); // This can not be updated via the endpoint
        });

        it('should fail if unable to save model', async () => {
          let { user, organization } = await factory.users.createAndLogin(fetchValues);

          await app.hijackModel(
            'User',
            (User) => {
              return class TestUser extends User {
                constructor(...args) {
                  super(...args);

                  const originalMethod = this.getOrganizationUserLink;

                  this.getOrganizationUserLink = async function(_organizationID) {
                    let link = await originalMethod.call(this, _organizationID);
                    if (link) {
                      // Force bad save
                      link.save = async function() {
                        throw new Error('Failed!');
                      };
                    }

                    return link;
                  };
                }
              };
            },
            // runner
            async () => {
              let result = await app[method](`/api/v1/organization/${organization.id}/user/${user.id}`, { data: { firstName: 'Derp' } });
              expect(result.statusCode).toEqual(500);
              expect(result.body).toEqual('Failed to update user');
            },
          );
        });

        it('should fail if user id is not found', async () => {
          let { organization } = await factory.users.createAndLogin(
            {
              userData: {
                email:      'admin@example.com',
                phone:      '555-555-5555',
                firstName:  'Admin',
                lastName:   'Dude',
                dob:        '2001-06-01',
              },
              userRole: 'admin',
            },
          );

          let result = await app[method](`/api/v1/organization/${organization.id}/user/bad-user-id`, { data: { firstName: 'Johny', lastName: 'Bob' } });
          expect(result.statusCode).toEqual(404);
          expect(result.body).toEqual('User not found');
        });

        it('should disallow admin user to update user from another organization', async () => {
          let { user, organization } = await factory.users.createAndLogin(
            {
              userData: {
                email:      'admin@example.com',
                phone:      '555-555-5555',
                firstName:  'Admin',
                lastName:   'Dude',
                dob:        '2001-06-01',
              },
              userRole: 'admin',
            },
          );

          let { user: otherUser } = await factory.users.createWithOrganization();

          let result = await app[method](`/api/v1/organization/${organization.id}/user/${otherUser.id}`, { data: { firstName: 'Johny', lastName: 'Bob' } });
          expect(result.statusCode).toEqual(403);
          expect(result.body).toEqual('Forbidden');

          // Ensure that the admin user wasn't updated
          expect(user.email).toEqual('admin@example.com');
          expect(user.phone).toEqual('555-555-5555');
          expect(user.firstName).toEqual('Admin');
          expect(user.lastName).toEqual('Dude');
          expect(user.dob.toUTC().toFormat('yyyy-MM-dd')).toEqual('2001-06-01');
        });

        it('should disallow admin user to update another admin user from the same organization', async () => {
          let { user, organization } = await factory.users.createAndLogin(
            {
              userData: {
                email:      'admin@example.com',
                phone:      '555-555-5555',
                firstName:  'Admin',
                lastName:   'Dude',
                dob:        '2001-06-01',
              },
              userRole: 'admin',
            },
          );

          let { user: otherUser } = await factory.users.create({ organization, userRole: 'admin' });

          let result = await app[method](`/api/v1/organization/${organization.id}/user/${otherUser.id}`, { data: { firstName: 'Johny', lastName: 'Bob' } });
          expect(result.statusCode).toEqual(403);
          expect(result.body).toEqual('Forbidden');

          // Ensure that the admin user wasn't updated
          expect(user.email).toEqual('admin@example.com');
          expect(user.phone).toEqual('555-555-5555');
          expect(user.firstName).toEqual('Admin');
          expect(user.lastName).toEqual('Dude');
          expect(user.dob.toUTC().toFormat('yyyy-MM-dd')).toEqual('2001-06-01');
        });

        it('should disallow superadmin user to update user from another organization', async () => {
          let { user, organization } = await factory.users.createAndLogin(
            {
              userData: {
                email:      'superadmin@example.com',
                phone:      '555-555-5555',
                firstName:  'Super',
                lastName:   'Admin',
                dob:        '2001-06-01',
              },
              userRole: 'admin',
            },
          );

          let { user: otherUser } = await factory.users.createWithOrganization();

          let result = await app[method](`/api/v1/organization/${organization.id}/user/${otherUser.id}`, { data: { firstName: 'Johny', lastName: 'Bob' } });
          expect(result.statusCode).toEqual(403);
          expect(result.body).toEqual('Forbidden');

          // Ensure that the admin user wasn't updated
          expect(user.email).toEqual('superadmin@example.com');
          expect(user.phone).toEqual('555-555-5555');
          expect(user.firstName).toEqual('Super');
          expect(user.lastName).toEqual('Admin');
          expect(user.dob.toUTC().toFormat('yyyy-MM-dd')).toEqual('2001-06-01');
        });

        it('should allow superadmin user to update admin user of the same organization', async () => {
          let { user, organization } = await factory.users.createAndLogin(
            {
              userData: {
                email:      'superadmin@example.com',
                phone:      '555-555-5555',
                firstName:  'Super',
                lastName:   'Admin',
                dob:        '2001-06-01',
              },
              userRole: 'superadmin',
            },
          );

          let { user: otherUser, organization: otherOrganization } = await factory.users.createWithOrganization({ userRole: 'admin' });

          // Should result in 403 because user isn't in this organization
          let result = await app[method](`/api/v1/organization/${organization.id}/user/${otherUser.id}`, { data: { firstName: 'Johny', lastName: 'Bob' } });
          expect(result.statusCode).toEqual(403);

          // Should result in 403 because superadmin doesn't have
          // permissions in this organization
          result = await app[method](`/api/v1/organization/${otherOrganization.id}/user/${otherUser.id}`, { data: { firstName: 'Johny', lastName: 'Bob' } });
          expect(result.statusCode).toEqual(403);

          await otherOrganization.addUser(user, { userRole: 'superadmin' });
          result = await app[method](`/api/v1/organization/${otherOrganization.id}/user/${otherUser.id}`, { data: { firstName: 'Johny', lastName: 'Bob' } });
          expect(result.statusCode).toEqual(200);

          // Verify response
          let data = result.body.data;
          expect(data.id).toEqual(otherUser.id);
          expect(data.email).toEqual(otherUser.email);
          expect(data.phone).toEqual('+1-560-452-0919');
          expect(data.firstName).toEqual('Johny');
          expect(data.lastName).toEqual('Bob');
          expect(data.dob).toEqual('2000-01-01');

          // Load from DB to ensure the updates were stored
          let loadedUser = await models.User.$.id.EQ(otherUser.id).first();
          expect(loadedUser.id).toEqual(otherUser.id);
          expect(loadedUser.email).toEqual(otherUser.email);
          expect(loadedUser.phone).toEqual('15604520919');
          expect(loadedUser.firstName).toEqual('Test');
          expect(loadedUser.lastName).toEqual('User');
          expect(loadedUser.dob.toUTC().toFormat('yyyy-MM-dd')).toEqual('2000-01-01');

          // Ensure that the admin user wasn't updated
          expect(user.email).toEqual('superadmin@example.com');
          expect(user.phone).toEqual('555-555-5555');
          expect(user.firstName).toEqual('Super');
          expect(user.lastName).toEqual('Admin');
          expect(user.dob.toUTC().toFormat('yyyy-MM-dd')).toEqual('2001-06-01');
        });

        it('should allow admin user to update another user of the same organization', async () => {
          let { user, organization } = await factory.users.createAndLogin(
            {
              userData: {
                email:      'admin@example.com',
                phone:      '555-555-5555',
                firstName:  'Admin',
                lastName:   'Dude',
                dob:        '2001-06-01',
              },
              userRole: 'admin',
            },
          );

          let { user: otherUser } = await factory.users.create({ organization });

          let result = await app[method](`/api/v1/organization/${organization.id}/user/${otherUser.id}`, { data: { firstName: 'Johny', lastName: 'Bob' } });
          expect(result.statusCode).toEqual(200);

          // Verify response
          let data = result.body.data;
          expect(data.id).toEqual(otherUser.id);
          expect(data.email).toEqual(otherUser.email);
          expect(data.phone).toEqual('+1-560-452-0919');
          expect(data.firstName).toEqual('Johny');
          expect(data.lastName).toEqual('Bob');
          expect(data.dob).toEqual('2000-01-01');

          // Load from DB to ensure the updates were stored
          let loadedUser = await models.User.$.id.EQ(otherUser.id).first();
          expect(loadedUser.id).toEqual(otherUser.id);
          expect(loadedUser.email).toEqual(otherUser.email);
          expect(loadedUser.phone).toEqual('15604520919');
          expect(loadedUser.firstName).toEqual('Test');
          expect(loadedUser.lastName).toEqual('User');
          expect(loadedUser.dob.toUTC().toFormat('yyyy-MM-dd')).toEqual('2000-01-01');

          // Ensure that the admin user wasn't updated
          expect(user.email).toEqual('admin@example.com');
          expect(user.phone).toEqual('555-555-5555');
          expect(user.firstName).toEqual('Admin');
          expect(user.lastName).toEqual('Dude');
          expect(user.dob.toUTC().toFormat('yyyy-MM-dd')).toEqual('2001-06-01');
        });

        it('should allow superadmin user to update another user of the same organization', async () => {
          let { user, organization } = await factory.users.createAndLogin(
            {
              userData: {
                email:      'superadmin@example.com',
                phone:      '555-555-5555',
                firstName:  'Super',
                lastName:   'Admin',
                dob:        '2001-06-01',
              },
              userRole: 'superadmin',
            },
          );

          let { user: otherUser } = await factory.users.create({ organization });

          let result = await app[method](`/api/v1/organization/${organization.id}/user/${otherUser.id}`, { data: { firstName: 'Johny', lastName: 'Bob' } });
          expect(result.statusCode).toEqual(200);

          // Verify response
          let data = result.body.data;
          expect(data.id).toEqual(otherUser.id);
          expect(data.email).toEqual(otherUser.email);
          expect(data.phone).toEqual('+1-560-452-0919');
          expect(data.firstName).toEqual('Johny');
          expect(data.lastName).toEqual('Bob');
          expect(data.dob).toEqual('2000-01-01');

          // Load from DB to ensure the updates were stored
          let loadedUser = await models.User.$.id.EQ(otherUser.id).first();
          expect(loadedUser.id).toEqual(otherUser.id);
          expect(loadedUser.email).toEqual(otherUser.email);
          expect(loadedUser.phone).toEqual('15604520919');
          expect(loadedUser.firstName).toEqual('Test');
          expect(loadedUser.lastName).toEqual('User');
          expect(loadedUser.dob.toUTC().toFormat('yyyy-MM-dd')).toEqual('2000-01-01');

          // Ensure that the superadmin user wasn't updated
          expect(user.email).toEqual('superadmin@example.com');
          expect(user.phone).toEqual('555-555-5555');
          expect(user.firstName).toEqual('Super');
          expect(user.lastName).toEqual('Admin');
          expect(user.dob.toUTC().toFormat('yyyy-MM-dd')).toEqual('2001-06-01');
        });

        it('should allow support user to update another user in any organization', async () => {
          let { user, organization } = await factory.users.createAndLogin(
            {
              userData: {
                email:      'support@example.com',
                phone:      '555-555-5555',
                firstName:  'Support',
                lastName:   'Guy',
                dob:        '2001-06-01',
              },
              userRole: 'support',
            },
          );

          let { user: otherUser, organization: otherOrganization } = await factory.users.createWithOrganization();

          // Should be a 404 because the user isn't in this organization
          let result = await app[method](`/api/v1/organization/${organization.id}/user/${otherUser.id}`, { data: { firstName: 'Johny', lastName: 'Bob' } });
          expect(result.statusCode).toEqual(404);

          result = await app[method](`/api/v1/organization/${otherOrganization.id}/user/${otherUser.id}`, { data: { firstName: 'Johny', lastName: 'Bob' } });
          expect(result.statusCode).toEqual(200);

          // Verify response
          let data = result.body.data;
          expect(data.id).toEqual(otherUser.id);
          expect(data.email).toEqual(otherUser.email);
          expect(data.phone).toEqual('+1-560-452-0919');
          expect(data.firstName).toEqual('Johny');
          expect(data.lastName).toEqual('Bob');
          expect(data.dob).toEqual('2000-01-01');

          // Load from DB to ensure the updates were stored
          let loadedUser = await models.User.$.id.EQ(otherUser.id).first();
          expect(loadedUser.id).toEqual(otherUser.id);
          expect(loadedUser.email).toEqual(otherUser.email);
          expect(loadedUser.phone).toEqual('15604520919');
          expect(loadedUser.firstName).toEqual('Test');
          expect(loadedUser.lastName).toEqual('User');
          expect(loadedUser.dob.toUTC().toFormat('yyyy-MM-dd')).toEqual('2000-01-01');

          // Ensure that the support user wasn't updated
          expect(user.email).toEqual('support@example.com');
          expect(user.phone).toEqual('555-555-5555');
          expect(user.firstName).toEqual('Support');
          expect(user.lastName).toEqual('Guy');
          expect(user.dob.toUTC().toFormat('yyyy-MM-dd')).toEqual('2001-06-01');
        });

        it('should allow masteradmin user to update another user in any organization', async () => {
          let { user, organization } = await factory.users.createAndLogin(
            {
              userData: {
                email:      'master@example.com',
                phone:      '555-555-5555',
                firstName:  'Master',
                lastName:   'Admin',
                dob:        '2001-06-01',
              },
              userRole: 'masteradmin',
            },
          );

          let { user: otherUser, organization: otherOrganization } = await factory.users.createWithOrganization();

          // Should equal 404 because user isn't in this organization
          let result = await app[method](`/api/v1/organization/${organization.id}/user/${otherUser.id}`, { data: { firstName: 'Johny', lastName: 'Bob' } });
          expect(result.statusCode).toEqual(404);

          result = await app[method](`/api/v1/organization/${otherOrganization.id}/user/${otherUser.id}`, { data: { firstName: 'Johny', lastName: 'Bob' } });
          expect(result.statusCode).toEqual(200);

          // Verify response
          let data = result.body.data;
          expect(data.id).toEqual(otherUser.id);
          expect(data.email).toEqual(otherUser.email);
          expect(data.phone).toEqual('+1-560-452-0919');
          expect(data.firstName).toEqual('Johny');
          expect(data.lastName).toEqual('Bob');
          expect(data.dob).toEqual('2000-01-01');

          // Load from DB to ensure the updates were stored
          let loadedUser = await models.User.$.id.EQ(otherUser.id).first();
          expect(loadedUser.id).toEqual(otherUser.id);
          expect(loadedUser.email).toEqual(otherUser.email);
          expect(loadedUser.phone).toEqual('15604520919');
          expect(loadedUser.firstName).toEqual('Test');
          expect(loadedUser.lastName).toEqual('User');
          expect(loadedUser.dob.toUTC().toFormat('yyyy-MM-dd')).toEqual('2000-01-01');

          // Ensure that the masteradmin user wasn't updated
          expect(user.email).toEqual('master@example.com');
          expect(user.phone).toEqual('555-555-5555');
          expect(user.firstName).toEqual('Master');
          expect(user.lastName).toEqual('Admin');
          expect(user.dob.toUTC().toFormat('yyyy-MM-dd')).toEqual('2001-06-01');
        });
      });
    };

    const methods = [ 'post', 'patch' ];
    for (let i = 0, il = methods.length; i < il; i++) {
      let method = methods[i];
      generateTests(method);
    }
  });
});
