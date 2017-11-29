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
module.exports.hash = function hashPassword(password, salt, callback) {
  const len = LEN / 2;

  if (arguments.length === 3) {
    crypto.pbkdf2(password, salt, ITERATIONS, len, DIGEST, (err, derivedKey) => {
      if (err) {
        return callback(err);
      }

      return callback(null, derivedKey.toString('hex'));
    });
  } else {
    callback = salt;
    crypto.randomBytes(SALT_LEN / 2, (err, salt) => {
      if (err) {
        return callback(err);
      }

      salt = salt.toString('hex');
      crypto.pbkdf2(password, salt, ITERATIONS, len, DIGEST, (err, derivedKey) => {
        if (err) {
          return callback(err);
        }

        callback(null, derivedKey.toString('hex'), salt);
      });
    });
  }
};

/**
 * Verifies if a password matches a hash by hashing the password
 * with a given salt
 *
 * @param {String} password
 * @param {String} hash
 * @param {String} salt
 * @param {Function} callback
 */
exports.verify = function verify(password, hash, salt, callback) {
  hashPassword(password, salt, (err, hashedPassword) => {
    if (err) {
      return callback(err);
    }

    if (hashedPassword === hash) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  });
};
