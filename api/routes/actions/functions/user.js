const mysql = require("mysql"),
      db = require("db");

module.exports.account = {};
module.exports.portfolio = {};
module.exports.history = {};

module.exports.getName = function(apikey, res, callbackfn) {
  //execute an SQL query
  let sql = "SELECT username FROM stock_userlist WHERE hash = " + mysql.escape( apikey );

  db.query(sql, function (err, result) {
    if (err) {
      //if there is an error
      res.send("Internal server error"); //send error to client
      console.log(err);
      return;

    } else if( result.length == 0 ){
      //if no results
      res.send("Apikey not associated with any account."); //send error to client
      console.log("Apikey "+ apikey +" not associated with any account.");
      return;

    } else {
      //run if apikey is found within the database
      console.log( JSON.stringify(result) );
      /*  should return [{
            "username": "string"
          }]
      */
      callbackfn(result[0].username); //return username
    }
  });
}

module.exports.account.getInfo = function(username, res, callbackfn) {
  let userData = [];
  //get all user data
  let sql = "SELECT * FROM stock_account_" + username;
  db.query(sql, function (err, result) {
    if (err) {
      //if there is an error
      res.send("Internal server error");
      console.log(err);
      return;

    } else if( result.length > 0 ){
      for( row of result ) {
        //for each row in result (should be 3, one for interest, cash, and loan)
        userData[ row.name ] = row.value; //put this variable into the userInfo object
      }

      callbackfn(userData)
      console.log(userData);
    }
  });
}
/**
 * updateAccount - updates the account values for loan & cash
 * @param  {string} username    username to be updated
 * @param  {[type]} res         [description]
 * @param  {cash: {float}, loan: {float}} accountInfo  object with the new values to be updated
 * @param  {function(message)}  callbackfn  function to call once completed
 * @return {none}               no return variable
 */
module.exports.account.update = function(username, res, accountInfo, callbackfn) {
  let sql = ``;

  if(accountInfo.cash !== undefined)
    sql += `UPDATE stock_account_${username} SET value = ${accountInfo.cash} WHERE name='cash';`;

  if(accountInfo.loan !== undefined)
    sql += `UPDATE stock_account_${username} SET value = ${accountInfo.loan} WHERE name='loan'`;

  db.query(sql, function (err, result) {
    if (err) {
      res.send({"error": "Internal Server Error."});
      console.log(err);
      return;
    }
    console.log(username + " updated account info.");

    callbackfn();
  });
}

/**
 * addToHistory - updates the history of an account
 * @param  {[type]} username   [description]
 * @param  {[type]} res        [description]
 * @param  {{ symbol: {string}
 *            exchange: {string}
 *            quantity: {float}
 *            price: {float},
 *            action: {string]}
 *         }} info       all the information to be uploaded
 * @param  {function} callbackfn [description]
 * @return {none}            [description]
 */
module.exports.history.add = function(username, res, info, callbackfn) {
  //get date in MYSQL format
  let date = new Date(new Date().getTime()+ new Date().getTimezoneOffset()*60*1000 + -300*60*1000).toISOString().slice(0, 19).replace('T', ' ');

  let sql = `INSERT INTO stock_history_${username} (date, symbol, exchange, action, quantity, price)
  VALUES ('${date}', '${info.symbol}', '${info.exchange}', '${info.action}', ${info.quantity}, ${info.price})`;
    db.query(sql, function (err, result) {
      if (err) {
        res.send({"error": "Internal Server Error."});
        console.log(err);
        return;
      }
      console.log(username + " had a record added to its history");

      callbackfn();
    });
}

/**
 * addToPortfolio - updates the portfolio of an account
 * @param  {[type]} username   [description]
 * @param  {[type]} res        [description]
 * @param  {{ symbol: {string}
 *            exchange: {string}
 *            quantity: {float}
 *            price: {float}}
 *         }} info       all the information to be uploaded
 * @param  {function} callbackfn [description]
 * @return {none}            [description]
 */
module.exports.portfolio.add = function(username, res, info, callbackfn) {
  //get date in MYSQL format
  let date = new Date(new Date().getTime()+ new Date().getTimezoneOffset()*60*1000 + -300*60*1000).toISOString().slice(0, 19).replace('T', ' ');

  let sql = `INSERT INTO stock_portfolio_${username} (symbol, exchange, buy, quantity, lastupdate)
  VALUES ('${info.symbol}', '${info.exchange}', ${info.price}, ${info.quantity}, '${date}')`;
    db.query(sql, function (err, result) {
      if (err) {
        res.send({"error": "Internal Server Error."});
        console.log(err);
        return;
      }
      console.log(username + "had a record added to its portfolio");

      callbackfn();
    });
}

module.exports.portfolio.getRows = function(username, res, symbol, type, callbackfn) {
  var sql;

  switch(type) {
    case "stock":
      sql = `SELECT * FROM stock_portfolio_${username}
      WHERE symbol = '${symbol}'
      AND NOT exchange = 'CRYPTO'`;
      break;
    case "crypto":
      sql = `SELECT * FROM stock_portfolio_${username}
      WHERE symbol = '${symbol}'
      AND exchange = 'CRYPTO'`;
      break;
    default:
      res.send({"error": "Internal server error within user.portfolio.getRows"});
      console.log("Internal server error within user.portfolio.getRows");
  }

  db.query(sql, function (err, result) {
    if (err) {
      //if there is an error
      res.send("Internal server error");
      console.log(err);
      return;

    } else if( result.length > 0 ){
      //if there is a result
      callbackfn(result);
    } else {
      //if 0 results
      res.send({"error": symbol + " was not found in your account"});
      console.log(symbol + " was not found in the account of " + username);
      return;
    }
  });
}

module.exports.portfolio.delete = function(username, res, id) {
  let sql = `DELETE FROM stock_portfolio_${username}
  WHERE id = ${id}`;
  db.query(sql, function (err, result) {
    if (err) {
      //if there is an error
      res.send("Internal server error");
      console.log(err);
      return;

    } else {
      //if succesful
      console.log("Succesfully deleted id " + id + " from " + username + "'s portfolio")
    }
  });
}

module.exports.portfolio.update = function(username, res, id, value, callbackfn) {
  //get current EST date in MYSQL format
  let date = new Date(new Date().getTime()+ new Date().getTimezoneOffset()*60*1000 + -300*60*1000).toISOString().slice(0, 19).replace('T', ' ');

  let sql = `UPDATE stock_portfolio_${username}
  SET quantity=${value}, lastupdate='${date}'
  WHERE id = ${id}`;
  db.query(sql, function (err, result) {
    if (err) {
      //if there is an error
      res.send("Internal server error");
      console.log(err);
      return;

    } else {
      //if succesful
      console.log("Succesfully updated id " + id + " from " + username + "'s portfolio")
      callbackfn();
    }
  });
}
