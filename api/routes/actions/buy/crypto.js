// url.com/crypto/buy?apikey&symbol&quantity&useLoan
// param apikey: its an api key
const mysql = require("mysql"),
      db = require("db"),
      quote = require("../functions/stockquote"),
      user = require("../functions/user");

module.exports = function(req, res) {
  if(req.body.symbol === undefined) req.body.symbol = "";
  if(req.body.quantity === undefined) req.body.quantity = 0;
  if(req.body.percent === undefined) req.body.percent = 0;
  if(req.body.useLoan === undefined) req.body.useLoan = false;

  let apikey = req.body.apikey,
      symbol = req.body.symbol.toUpperCase(),
      quantity = Number( req.body.quantity ),
      percent = Number( req.body.percent ),
      useLoan = req.body.useLoan === 'true'; //convert req.body.useLoan from string to boolean
  console.log(req.body);

  //error checking within variables
  if( apikey === undefined ) res.send({"error": "Apikey undefined"}); //check if apikey is undefined
  else if( symbol == "" ) res.send({"error": "Symbol undefined"}); //check if symbol is undefined
  else if( quantity == 0 && percent == 0) res.send({"error": "Quantity/percent both are undefined"}); //check if quantity is undefined
  else if( percent != 0 && quantity != 0 ) res.send({"error": "Please specify either only percent, or only quantity"}); //check if percent is invalid
  else if( (isNaN(quantity) || quantity < 0) && percent == 0) res.send({"error": "Quantity must be an (float) number greater than 0"}); //check if quantity is not a number or is less than 0
  else if( (isNaN(percent) || percent < 0 || percent > 1) && quantity == 0) res.send({"error": "Percent must be a decimal from 0-1"}); //check if percent is invalid
  else {
    //get cryptodata
    quote.getCryptoInfo([symbol], function( data ) {
      //check if there is any data returned
      if(Object.keys(data).length === 0 && data.constructor === Object){
        //no data returned
        res.send({"error": "Crypto not found."});
        console.log("Buy request: " + symbol + " Crypto not found");
        return;
      }
      console.log(data);
      const price = data[symbol].price,
            exchange = "CRYPTO";

      //finally confirm the buy
      user.getName(apikey, res, function(username) {
        user.account.getInfo(username, res, function(userData) {
          let cash = userData.cash,
              loan = userData.loan;

          if(percent > 0) {
            if(useLoan) quantity =  ((cash + loan - 25)/price) * percent; //add loan to the calculation of useLoan was set to true
            else quantity = ((cash - 25)/price) * percent;
          }

          //check if quantity is 0 as a result
          if(quantity <= 0) {
            res.send({"error": "Not enough cash to make the purchase without loans"});
            return;
          }

          let totalValue = price * quantity + 25; //add 25 for transaction fees

          //check if the loan + cash in the account can cover the cost of the purchase
          if(cash + loan >= totalValue) {

            //if player's cash can cover the purchase, only update cash
            if(cash >= totalValue) {
              cash = cash - totalValue;

              user.account.update(username, res, { cash: cash }, function() {
                //after updating account, add to user's history
                user.history.add(username, res, {
                  symbol: symbol,
                  exchange: exchange,
                  quantity: quantity,
                  price: price,
                  action: "buy"
                }, function() {
                  //after adding to history, add to portfolio
                  user.portfolio.add(username, res, {
                    symbol: symbol,
                    exchange: exchange,
                    quantity: quantity,
                    price: price
                  }, function() {
                    res.send({
                      "success": "Crypto successfully purchased",
                      "info": {
                        "crypto": symbol,
                        "price": price,
                        "quantity": quantity,
                        "totalValue": totalValue
                      }
                    });
                  });
                });
              });

            } else {
              //update cash and loan
              loan = loan - (totalValue - cash); //have the available loan amount decrease by the amount needed to make the purchase

              user.account.update(username, res, { cash: 0, loan: loan }, function() {
                //after updating account, add to user's history
                user.history.add(username, res, {
                  symbol: symbol,
                  exchange: exchange,
                  quantity: quantity,
                  price: price,
                  action: "buy"
                }, function() {
                  //after adding to history, add to portfolio
                  user.portfolio.add(username, res, {
                    symbol: symbol,
                    exchange: exchange,
                    quantity: quantity,
                    price: price
                  }, function() {
                    res.send({
                      "success": "Crypto successfully purchased",
                      "info": {
                        "crypto": symbol,
                        "price": price,
                        "quantity": quantity,
                        "totalValue": totalValue
                      }
                    });
                  });
                });
              });

            }

          } else {
            res.send({"error": "Not enough funds."});
          }

        });
      });

    })
  }
}
