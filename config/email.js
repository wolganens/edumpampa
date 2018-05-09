var mailgun = require('mailgun-js')({apiKey: process.env.API_KEY, domain: process.env.DOMAIN});

const email = {
  transport: null,
  emailOptions: {
    from: '"Equipe EduMPampa" <edumpampa@gmail.com>',
    to: 'edumpampa@gmail.com',
    subject: '',
    html: '',
  },
  setEmailOptions(options) {
    this.emailOptions.to = options.to;
    this.emailOptions.subject = options.subject;
    this.emailOptions.html = options.html;
  },
  sendMail(options, callback) {    
    this.setEmailOptions(options);
    mailgun.messages().send(this.emailOptions, function (error, body) {
      console.log(body);
    });
    callback();
  },
};

module.exports = email;
