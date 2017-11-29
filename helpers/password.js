/**
 * Constants
 */
const LEN = 256;
const SALT_LEN = 64;
const ITERATIONS = 10000;
const DIGEST = 'sha256';

/**
 * Module dependencies
 */
const crypto = require('crypto');

/**
 * Creates a hash based on a salt from a given password
 * if there is no salt a new salt will be generated
 *
 * @param {String} password
 * @param {String} salt - optional
 * @param {Function} callback
 */
function hashPassword(password, salt, callback) {
  const len = LEN / 2;

  if (arguments.length === 3) {
    crypto.pbkdf2(password, salt, ITERATIONS, len, DIGEST, (err, derivedKey) => {
      if (err) {
        return callback(err);
      }

      return callback(null, derivedKey.toString('hex'));
    });
  } else {
    const cb = salt;
    crypto.randomBytes(SALT_LEN / 2, (rbErr, newSalt) => {
      let nSalt = newSalt;
      if (rbErr) {
        return cb(rbErr);
      }
      nSalt = newSalt.toString('hex');
      return crypto.pbkdf2(password, nSalt, ITERATIONS, len, DIGEST, (pbkf2Err, derivedKey) => {
        if (pbkf2Err) {
          return cb(pbkf2Err);
        }
        return cb(null, derivedKey.toString('hex'), nSalt);
      });
    });
  }
}

module.exports.hash = hashPassword;

/**
 * Verifies if a password matches a hash by hashing the password
 * with a given salt
 *
 * @param {String} password
 * @param {String} hash
 * @param {String} salt
 * @param {Function} callback
 */
exports.verify = (password, hash, salt, callback) => hashPassword(
  password,
  salt,
  (err, hashedPassword) => {
    if (err) {
      return callback(err);
    }
    if (hashedPassword === hash) {
      return callback(null, true);
    }
    return callback(null, false);
  },
);
