const generator = require('generate-password');
const mongoose = require('mongoose');
const _ = require('lodash');

const passwordHelper = require('../helpers/password');

const { Schema } = mongoose;

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: [true, 'Informe um endereço de email!'],
  },
  name: {
    type: String,
    required: [true, 'Informe seu nome completo!'],
  },
  password: {
    type: String,
    required: [function required() { return !this.google_id; }, 'Informe  uma senha!'],
    select: false,
  },
  passwordSalt: {
    type: String,
    required: () => !this.google_id,
    select: false,
  },
  active: {
    type: Boolean,
    default: true,
  },
  google: {
    type: Object,
    required: false,
  },
  google_id: {
    type: String,
    required: false,
  },
  qualification_id: {
    type: Schema.Types.ObjectId,
    ref: 'Qualification',
    required: [function required() { return !this.qualification_text; }, 'Escolha ou informe uma formação!'],
  },
  qualification_text: {
    type: String,
    required: [function required() { return !this.qualification_id; }, 'Escolha ou informe uma formação!'],
  },
  occupation_area_id: {
    type: Schema.Types.ObjectId,
    ref: 'OccupationArea',
    required: [function required() { return !this.occupation_area_text; }, 'Escolha ou informe uma área de atuação!'],
  },
  occupation_area_text: {
    type: String,
    required: [function required() { return !this.occupation_area_id; }, 'Escolha ou informe uma área de atuação!'],
  },
  institutional_link_id: {
    type: Schema.Types.ObjectId,
    ref: 'InstitutionalLink',
    required: [function required() { return !this.institutional_link_text; }, 'Escolha ou informe um vínculo institucional!'],
  },
  institutional_link_text: {
    type: String,
    required: [function required() { return !this.institutional_link_id; }, 'Escolha ou informe um vínculo institucional!'],
  },
  institutional_post_id: [{
    type: Schema.Types.ObjectId,
    ref: 'InstitutionalPost',
    required: false,
  }],
  institutional_post_text: {
    type: String,
    required: false,
  },
  institution_name: {
    type: String,
    required: [function required() { return !this.google_id; }, 'Informe a instituição à qual está vinculado(a)!'],
  },
  institution_address: {
    type: String,
    required: [function required() { return !this.google_id; }, 'Informe o endereço da instituição'],
  },
  birthday: {
    type: Date,
    required: [function required() { return !this.google_id; }, 'Informe sua data de nascimento!'],
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
  role: {
    type: String,
    enum: ['COMMON', 'AUTHORIZED', 'ADMIN'],
    default: ['COMMON'],
    required: true,
  },
});

/**
* Find a user by it's email and checks the password againts the stored hash
*
* @param {String} email
* @param {String password
* @param {Function} callback
*/
UserSchema.statics.authenticate = function authenticate(email, password, callback) {
  return this.findOne({ email }).select('+password +passwordSalt').exec((userErr, user) => {
    const authUser = user;
    if (userErr) {
      return callback(userErr, null);
    }

    // no user found just return the empty user
    if (!authUser) {
      return callback(userErr, authUser);
    }

    // verify the password with the existing hash from the user
    return passwordHelper.verify(
      password,
      authUser.password,
      authUser.passwordSalt,
      (err, result) => {
        if (err) {
          return callback(err, null);
        }

        // if password does not match don't return user
        if (result === false) {
          return callback(err, null);
        }

        // remove password and salt from the result
        authUser.password = undefined;
        authUser.passwordSalt = undefined;
        // return user if everything is ok
        return callback(err, authUser);
      },
    );
  });
};

/**
* Create a new user with the specified properties
*
* @param {Object} opts - user data
* @param {Function} callback
*/
UserSchema.statics.register = function register(opts, callback) {
  const self = this;
  const data = _.cloneDeep(opts);

  // hash the password
  return passwordHelper.hash(opts.password, (hashErr, hashedPassword, salt) => {
    if (hashErr) {
      return callback(hashErr);
    }

    data.password = hashedPassword;
    data.passwordSalt = salt;

    // create the user
    return self.model('User').create(data, (err, user) => {
      const authUser = user;
      if (err) {
        return callback(err, null);
      }

      // remove password and salt from the result
      authUser.password = undefined;
      authUser.passwordSalt = undefined;
      // return user if everything is ok
      return callback(err, authUser);
    });
  });
};

/**
* Create an instance method to change password
*
*/
UserSchema.methods.resetPassword = () => {
  const self = this;
  const password = generator.generate({
    length: 8,
    numbers: true,
    symbols: true,
    strict: true,
  });
  return passwordHelper.hash(password, (hashErr, hashedPassword, salt, callback) => {
    if (hashErr) {
      return callback(hashErr, null);
    }
    self.password = hashedPassword;
    self.passwordSalt = salt;

    return self.save((err, saved) => {
      if (err) {
        return callback(err, null);
      }
      return callback(err, {
        saved,
        success: true,
        message: 'Password changed successfully.',
        type: 'password_change_success',
        password,
      });
    });
  });
};
UserSchema.methods.changePassword = function changePassword(oldPassword, newPassword, callback) {
  const self = this;
  // get the user from db with password and salt
  return self.model('User').findById(self.id).select('+password +passwordSalt').exec((findErr, user) => {
    if (findErr) {
      return callback(findErr, null);
    }
    // no user found just return the empty user
    if (!user) {
      return callback(findErr, user);
    }

    return passwordHelper.verify(
      oldPassword,
      user.password,
      user.passwordSalt,
      (verifyErr, result) => {
        if (verifyErr) {
          return callback(verifyErr, null);
        }
        // if password does not match don't return user
        if (result === false) {
          const PassNoMatchError = new Error('A senha anterior está incorreta!');
          PassNoMatchError.type = 'old_password_does_not_match';
          return callback(PassNoMatchError, null);
        }

        // generate the new password and save the changes
        return passwordHelper.hash(newPassword, (hashErr, hashedPassword, salt) => {
          if (hashErr) {
            return callback(hashErr, null);
          }
          self.password = hashedPassword;
          self.passwordSalt = salt;

          return self.save((saveErr, saved) => {
            if (saveErr) {
              return callback(saveErr, null);
            }
            return callback(saveErr, {
              saved,
              success: true,
              message: 'Password changed successfully.',
              type: 'password_change_success',
            });
          });
        });
      },
    );
  });
};

UserSchema.virtual('htmlSituation').get(function htmlSituation() {
  if (this.role === 'COMMON') {
    return '<div class="badge alert-danger">Desautorizado</div>';
  } else if (this.role === 'AUTHORIZED') {
    return '<div class="badge alert-success">Autorizado</div>';
  }
  return '<div class="badge"><strong>Admin</strong></div>';
});

UserSchema.virtual('getFormatedBirthday').get(function getFormatedBirthday() {
  const [
    birthday,
    date,
    month,
  ] = [this.birthday, this.birthday.getDate(), this.birthday.getMonth()];
  return `${date < 10 ? `0${date}` : date}/${month < 10 ? `0${month + 1}` : month + 1}/${birthday.getFullYear()}`;
});
// compile User model
module.exports = mongoose.model('User', UserSchema);
