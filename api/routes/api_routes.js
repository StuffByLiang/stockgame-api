module.exports = function(app) {
  app.get('/getUserData', require("./actions/getUserData"));
  app.post('/buy/stock', require("./actions/buy/stock"));
  app.post('/buy/crypto', require("./actions/buy/crypto"));
  app.post('/sell/stock', require("./actions/sell/stock"));
  app.post('/sell/crypto', require("./actions/sell/crypto"));
};
