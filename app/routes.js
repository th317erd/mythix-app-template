/* eslint-disable key-spacing */

'use strict';

const HELP = require('./route-help');

// This module defines all application routes.
// The "name" property on routes tells mythix
// to generate this route when generating API
// interfaces for clients.
//
// The "help" scope is used by the API
// interface generator to provide help
// for each generated API interface method.

module.exports = function getRoutes() {
  return {
    'api': {
      'v1': {
        // Serve the API interface to clients
        'client-interface.js': {
          'methods':    [ 'GET' ],
          'controller': 'APIInterfaceController.get',
        },

        // Health check endpoint
        'health': {
          'methods':    [ 'GET' ],
          'controller': 'HealthCheckController.health',
        },

        // Auth
        'auth': {
          'authenticate': [
            {
              'methods':    [ 'GET' ],
              'accept':     [ 'application/json' ],
              'controller': 'AuthController.authenticate',
            },
            {
              'name':       'login',
              'methods':    [ 'POST' ],
              'accept':     [ 'application/json' ],
              'controller': 'AuthController.authenticate',
              'help':       HELP.login,
            },
          ],
          'logout': [
            {
              'name':       'logout',
              'methods':    [ 'POST' ],
              'accept':     [ 'application/json' ],
              'controller': 'AuthController.logout',
              'help':       HELP.logout,
            },
          ],
          'sendMagicLink': [
            {
              'name':       'sendMagicLoginLink',
              'methods':    [ 'POST' ],
              'accept':     [ 'application/json' ],
              'controller': 'AuthController.sendMagicLink',
              'help':       HELP.sendMagicLoginLink,
            },
          ],
          'registerUser': [
            {
              'name':       'registerUser',
              'methods':    [ 'POST' ],
              'accept':     [ 'application/json' ],
              'controller': 'AuthController.registerUser',
              'help':       HELP.registerUser,
            },
          ],
        },

        // Users
        'user': {
          'current': [
            {
              'requiresOrgID':  false,
              'name':           'getCurrentUser',
              'methods':        [ 'GET' ],
              'controller':     'UserController.showCurrentUser',
              'help':           HELP.getCurrentUser,
            },
            {
              '/setCurrentOrganization': {
                'requiresOrgID':  false,
                'name':           'setCurrentOrganization',
                'methods':        [ 'POST' ],
                'controller':     'UserController.setCurrentOrganization',
                'help':           HELP.setCurrentOrganization,
              },
            },
            {
              'name':           'updateCurrentUser',
              'methods':        [ 'POST', 'PATCH' ],
              'accept':         [ 'application/json' ],
              'controller':     'UserController.update',
              'help':           HELP.updateCurrentUser,
            },
          ],
          '/<userID:string>': [
            {
              'name':       'getUser',
              'methods':    [ 'GET' ],
              'controller': 'UserController.show',
              'help':       HELP.getUser,
            },
            {
              'name':       'updateUser',
              'methods':    [ 'POST', 'PATCH' ],
              'accept':     [ 'application/json' ],
              'controller': 'UserController.update',
              'help':       HELP.updateUser,
            },
            {
              'tags': [
                {
                  'name':       'addUserTags',
                  'methods':    [ 'POST', 'PATCH' ],
                  'accept':     [ 'application/json' ],
                  'controller': 'UserController.addTags',
                  'help':       HELP.addUserTags,
                },
                {
                  'name':       'removeUserTags',
                  'methods':    [ 'DELETE' ],
                  'accept':     [ 'application/json' ],
                  'controller': 'UserController.removeTags',
                  'help':       HELP.removeUserTags,
                },
              ],
            },
          ],
          '/search':    {
            'name':       'searchUsers',
            'methods':    [ 'POST' ],
            'accept':     [ 'application/json' ],
            'controller': 'UserController.list',
            'help':       HELP.searchUsers,
          },
          '/': [
            {
              'name':       'getUsers',
              'methods':    [ 'GET' ],
              'accept':     [ 'application/json' ],
              'controller': 'UserController.list',
              'help':       HELP.getUsers,
            },
            // No create for now (might add later in the future)
            // {
            //   'methods':    [ 'PUT' ],
            //   'accept':     [ 'application/json' ],
            //   'controller': 'UserController.create',
            // },
          ],
        },

        // Organizations
        'organization': {
          '/<organizationID:string>': [
            {
              'name':       'getOrganization',
              'methods':    [ 'GET' ],
              'accept':     [ 'application/json' ],
              'controller': 'OrganizationController.show',
              'help':       HELP.getOrganization,
            },
            {
              'name':       'updateOrganization',
              'methods':    [ 'POST', 'PATCH' ],
              'accept':     [ 'application/json' ],
              'controller': 'OrganizationController.update',
              'help':       HELP.updateOrganization,
            },
          ],
          '/<organizationID:string>/inviteUser': [
            {
              'name':       'inviteUserToOrganization',
              'methods':    [ 'POST' ],
              'accept':     [ 'application/json' ],
              'controller': 'OrganizationController.inviteUser',
              'help':       HELP.inviteUserToOrganization,
            },
          ],
          '/<organizationID:string>/user/<userID:string>': [
            {
              'name':       'removeUserFromOrganization',
              'methods':    [ 'DELETE' ],
              'accept':     [ 'application/json' ],
              'controller': 'OrganizationController.removeUser',
              'help':       HELP.removeUserFromOrganization,
            },
            {
              '/updateUserAvatar': {
                'name':       'updateUserAvatar',
                'methods':    [ 'POST' ],
                'accept':     [ 'application/json', 'multipart/form-data' ],
                'controller': 'OrganizationController.updateUserAvatar',
                'help':       HELP.updateUserAvatar,
              },
            },
            {
              'name':       'updateOrganizationUser',
              'methods':    [ 'POST', 'PATCH' ],
              'accept':     [ 'application/json' ],
              'controller': 'OrganizationController.updateUser',
              'help':       HELP.updateOrganizationUser,
            },
          ],
          '/search':    {
            'name':       'searchOrganizations',
            'methods':    [ 'POST' ],
            'accept':     [ 'application/json' ],
            'controller': 'OrganizationController.list',
            'help':       HELP.searchOrganizations,
          },
          '/': [
            {
              'name':       'getOrganizations',
              'methods':    [ 'GET' ],
              'accept':     [ 'application/json' ],
              'controller': 'OrganizationController.list',
              'help':       HELP.getOrganizations,
            },
            {
              'requiresOrgID':  false,
              'name':           'createOrganization',
              'methods':        [ 'PUT' ],
              'accept':         [ 'application/json' ],
              'controller':     'OrganizationController.create',
              'help':           HELP.createOrganization,
            },
          ],
        },
      },
    },
  };
};
