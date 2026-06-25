const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Le dice a Puppeteer que descargue Chrome dentro de node_modules/.cache
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};