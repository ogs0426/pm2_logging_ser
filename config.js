let config;
if (process.env.NODE_ENV == 'prod') {
  config = require("./application.prod.json");
} else if (process.env.NODE_ENV == 'dev') {
  config = require("./application.dev.json");
} else if (process.env.NODE_ENV == 'stag') {
  config = require("./application.stag.json");
} else if (process.env.NODE_ENV == 'kakao') {
  config = require("./application.kakao.json");
}

module.exports = config;