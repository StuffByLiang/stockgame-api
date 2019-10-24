// url.com/getUserData?apikey
// param apikey: its an api key
mysql = require("mysql");
db = require("db");
user = require("./functions/user")

module.exports = function(req, res) {
  const apikey = req.query.apikey;

  //check if apikey is given
  if (apikey === undefined) {
    res.send({"error": "Request must contain an api key. Please refer to the documentation."});
    throw "no apikey given for /getUserData";
  }

  let username,
      userInfo = {
        account: {},
        portfolio: []
      }; //userinfo is an array to be returned to the client later

  user.getName(apikey, res, function(username) {

    //get all user data
    user.account.getInfo(username, res, function(userData) {
      for( item in userData ) {
        //for each row in result (should be 3, one for interest, cash, and loan)
        userInfo.account[ item ] = userData[item]; //put this variable into the userInfo object
      }

      //now get portfolio items
      sql = "SELECT * FROM stock_portfolio_" + username;
      db.query(sql, function (err, result) {
        if (err) {
          //if there is an error
          res.send({"error": "Internal server error"});
          throw err;

        } else if( result.length > 0 ){
          //add each row into the userInfo object
          for( row of result ) {
            userInfo.portfolio.push({
              "symbol": row.symbol,
              "exchange": row.exchange,
              "buy": row.buy,
              "quantity": row.quantity,
              "lastupdate": row.lastupdate
            });
          }
        }

      res.send( JSON.stringify(userInfo) ); //finally send userInfo to the client

      });
    });

  });
}
