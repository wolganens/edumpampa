'use strict';

module.exports = {
  port: process.env.PORT,
  hostname: "edumpampa.herokuapp.com",
  baseUrl: 'edumpampa.herokuapp.com',
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
