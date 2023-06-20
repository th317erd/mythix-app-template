'use strict';

// This area of the application statically defines
// all application roles available. The role
// and permission system use these roles
// to allow role creation for users, and
// to verify user roles when permission checking.
// Role models will fail to be created if the role
// "name" is not specified here first.

module.exports = [].concat(
  require('./global-roles'),
  require('./organizational-roles'),
).sort((a, b) => {
  let x = a.priority;
  let y = b.priority;

  if (x === y)
    return 0;

  return (x < y) ? -1 : 1;
});
