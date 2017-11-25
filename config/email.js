'use strict';
const nodemailer = require('nodemailer');

var email = {
	transport: null,
	emailOptions: {
		from: '"Equipe EduMPampa" <edumpampa@gmail.com>',
		to: '',
		subject: '',
		html: ''
	},
	setTransport: function() {
		this.transport = nodemailer.createTransport({
	        host: 'smtp.gmail.com',
	        port: 465,
	        secure: true, // true for 465, false for other ports
	        auth: {
	            user: 'edumpampa@gmail.com', // generated ethereal user
	            pass: 'unipampa123'  // generated ethereal password
	        }
	    })	
	},
	setEmailOptions: function(options) {
		this.emailOptions.to = options.to;
		this.emailOptions.subject = options.subject;
		this.emailOptions.html = options.html;
	},
	sendMail: function(options, callback) {
		this.setTransport();
		this.setEmailOptions(options);
		this.transport.sendMail(this.emailOptions);
		callback();
	},
};

module.exports = email;