const AccessControl = require('accesscontrol');

const ac = new AccessControl();

ac.grant('COMMON')
  .readAny('learningObject')
  .updateOwn('user')
  .deleteOwn('user')
  .grant('AUTHORIZED')
  .extend('COMMON')
  .createOwn('learningObject')
  .updateOwn('learningObject')
  .deleteOwn('learningObject')
  .grant('ADMIN')
  .extend(['COMMON', 'AUTHORIZED'])
  .createAny('user')
  .readAny('user')
  .updateAny('user')
  .deleteAny('user')
  .createAny('learningObject')
  .readAny('learningObject')
  .updateAny('learningObject')
  .deleteAny('learningObject');

module.exports = ac;
