const {join} = require('path');

module.exports = {
  excludePrivate: true,
  gaID: process.env.GOOGLE_ANALYTICS_ID,
  gitRevision: 'master',
  mode: 'modules',
  name: 'Cookie Service for Angular',
  out: join(__dirname, 'api')
};
