'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var _ = require('lodash');
var passwordHelper = require('../helpers/password');

var UserSchema = new Schema({
    email:  {
        type: String,
        required: true,
        unique: [true, "Informe um endereço de email!"]
    },
    name: {
        type: String,
        required: [true, "Informe seu nome completo!"]
    },
    password: {
        type: String,
        required: [function(){
            return !this.google_id
        }, "Informe  uma senha!"],
        select: false
    },
    passwordSalt: {
        type: String,
        required: function(){
            return !this.google_id
        },
        select: false
    },
    active: {
        type: Boolean,
        default: true
    },
    google: {
        type: Object,
        required: false,
    },
    google_id: {
        type: String,
        required: false
    },
    qualification_id: {
        type: Schema.Types.ObjectId,
        required: [function(){
            return !this.qualification_text;
        }, "Escolha ou informe uma formação!"]
    },
    qualification_text:{
        type: String,
        required: [function(){
            return !this.qualification_id;
        }, "Escolha ou informe uma formação!"]
    },
    occupation_area_id: {
        type: Schema.Types.ObjectId,
        required: [function(){
            return !this.occupation_area_text;
        }, "Escolha ou informe uma área de atuação!"]
    },
    occupation_area_text:{
        type: String,
        required: [function(){
            return !this.occupation_area_id;
        }, "Escolha ou informe uma área de atuação!"]
    },
    institutional_link_id: {
        type: Schema.Types.ObjectId,
        required: [function(){
            return !this.institutional_link_text;
        }, "Escolha ou informe um vínculo institucional!"]
    },
    institutional_link_text:{
        type: String,
        required: [function(){
            return !this.institutional_link_id;
        }, "Escolha ou informe um vínculo institucional!"]
    },
    institutional_post_id: {
        type: [Schema.Types.ObjectId],
        required: false
    },
    institutional_post_text:{
        type: String,
        required: false
    },
    institution_name: {
        type: String,
        required: [function(){
            return !this.google_id
        }, "Informe a instituição à qual está vinculado(a)!"],
    },
    institution_address: {
        type: String,
        required: [function(){
            return !this.google_id
        }, "Informe o endereço da instituição"],
    },
    birthday: {
        type: Date,
        required: [function(){
            return !this.google_id
        }, "Informe sua data de nascimento!"]
    },
    createdAt: {
        type: Date,
        default: new Date()
    },
    role: {
        type: String,
        enum: ["COMMON","AUTHORIZED","ADMIN"],
        default: ["COMMON"],
        required: true
    }
});

/**
* Find a user by it's email and checks the password againts the stored hash
*
* @param {String} email
* @param {String password
* @param {Function} callback
*/
UserSchema.statics.authenticate = function(email, password, callback) {
    this.findOne({ email: email }).select('+password +passwordSalt').exec(function(err, user) {
        if (err) {
            return callback(err, null);
        }

        // no user found just return the empty user
        if (!user) {
            return callback(err, user);
        }

        // verify the password with the existing hash from the user
        passwordHelper.verify(password, user.password, user.passwordSalt, function(err, result) {
            if (err) {
                return callback(err, null);
            }

            // if password does not match don't return user
            if (result === false) {
                return callback(err, null);
            }

            // remove password and salt from the result
            user.password = undefined;
            user.passwordSalt = undefined;
            // return user if everything is ok
            callback(err, user);
        });
    });
};

/**
* Create a new user with the specified properties
*
* @param {Object} opts - user data
* @param {Function} callback
*/
UserSchema.statics.register = function(opts, callback) {
    var self = this;
    var data = _.cloneDeep(opts);

    //hash the password
    passwordHelper.hash(opts.password, function(err, hashedPassword, salt) {
        if (err) {
            return callback(err);
        }

        data.password = hashedPassword;
        data.passwordSalt = salt;

        //create the user
        self.model('User').create(data, function(err, user) {
            if (err) {
                return callback(err, null);
            }

            // remove password and salt from the result
            user.password = undefined;
            user.passwordSalt = undefined;
            // return user if everything is ok
            callback(err, user);
        });
    });
};

/**
* Create an instance method to change password
*
*/
UserSchema.methods.resetPassword = function(email, callback) {
    var self = this;
    var password = generator.generate({
        length: 8,
        numbers: true,
        symbols: true,
        strict: true
    });
    passwordHelper.hash(password, function(err, hashedPassword, salt, callback) {
        self.password = hashedPassword;
        self.passwordSalt = salt;

        self.save(function(err, saved) {
            if (err) {
                return callback(err, null);
            }
            if (callback) {
                return callback(err, {
                    success: true,
                    message: 'Password changed successfully.',
                    type: 'password_change_success',
                    password: password
                });
            }
        });
    });
}
UserSchema.methods.changePassword = function(oldPassword, newPassword, callback) {
    var self = this;
    // get the user from db with password and salt
    self.model('User').findById(self.id).select('+password +passwordSalt').exec(function(err, user) {
        if (err) {
            return callback(err, null);
        }
        // no user found just return the empty user
        if (!user) {
            return callback(err, user);
        }

        passwordHelper.verify(oldPassword, user.password, user.passwordSalt, function(err, result) {
            if (err) {
                return callback(err, null);
            }

            // if password does not match don't return user
            if (result === false) {
                var PassNoMatchError = new Error('A senha anterior está incorreta!');
                PassNoMatchError.type = 'old_password_does_not_match';
                return callback(PassNoMatchError, null);
            }

            // generate the new password and save the changes
            passwordHelper.hash(newPassword, function(err, hashedPassword, salt) {
                self.password = hashedPassword;
                self.passwordSalt = salt;

                self.save(function(err, saved) {
                    if (err) {
                        return callback(err, null);
                    }
                    if (callback) {
                        return callback(err, {
                            success: true,
                            message: 'Password changed successfully.',
                            type: 'password_change_success'
                        });
                    }
                });
            });
        });
    });
};

UserSchema.virtual('htmlSituation').get(function(){
    if (this.role == 'COMMON') {
        return '<div class="badge alert-danger">Desautorizado</div>'
    } else if (this.role == 'AUTHORIZED') {
        return '<div class="badge alert-success">Autorizado</div>'
    } else {
        return '<div class="badge"><strong>Admin</strong></div>'
    }
});
UserSchema.virtual('getFormatedBirthday').get(function(){
    const birthday = this.birthday;
    const date = this.birthday.getDate();
    const month = this.birthday.getMonth();

    return (date < 10 ? "0" + date : date) + '/' + (month < 10 ? "0" + month : month) + '/' + birthday.getFullYear();
})
// compile User model
module.exports = mongoose.model('User', UserSchema);    
