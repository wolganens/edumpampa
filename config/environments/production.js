'use strict';

module.exports = {
  port: process.env.PORT,
  hostname: "tranquil-peak-52271.herokuapp.com",
  baseUrl: 'https://tranquil-peak-52271.herokuapp.com',
  mongodb: {
    uri: 'mongodb://edumpampa:unipampaedumpampa@ds129459.mlab.com:29459/edumpampa'
  },
  app: {
    name: "express starter"
  },
  serveStatic: true,
  session: {
    secret: 'someVeRyN1c3S#cr3tHer34U'
  },
  proxy: {
    trust: true
  },
  swig: {
    cache: false
  },
};
