// url.com/stock/sell?apikey&symbol&quantity
// param apikey: its an api key
const mysql = require("mysql"),
      db = require("db"),
      quote = require("../functions/stockquote"),
      user = require("../functions/user");

module.exports = function(req, res) {
  if(req.body.symbol === undefined) req.body.symbol = "";
  if(req.body.quantity === undefined) req.body.quantity = 0;
  if(req.body.percent === undefined) req.body.percent = 0;

  let apikey = req.body.apikey,
      symbol = req.body.symbol.toUpperCase(),
      quantity = Number( req.body.quantity ),
      percent = Number( req.body.percent );

  console.log(req.body);

  //error checking within variables
  if( apikey === undefined ) res.send({"error": "Apikey undefined"}); //check if apikey is undefined
  else if( symbol == "" ) res.send({"error": "Symbol undefined"}); //check if symbol is undefined
  else if( quantity == 0 && percent == 0) res.send({"error": "Quantity/percent both are undefined"}); //check if quantity is undefined
  else if( percent != 0 && quantity != 0 ) res.send({"error": "Please specify either only percent, or only quantity"}); //check if percent is invalid
  else if( (isNaN(quantity) || Math.floor(quantity) != quantity || quantity < 0) && percent == 0) res.send({"error": "Quantity must be an (integer) number greater than 0"}); //check if quantity is not a number or not an integer or is less than 0
  else if( (isNaN(percent) || percent < 0 || percent > 1) && quantity == 0) res.send({"error": "Percent must be a decimal from 0-1"}); //check if percent is invalid
  else {
    //get stockdata
    quote.getStockInfo([symbol], function( data ) {
      //check if there is any data returned
      if(Object.keys(data).length === 0 && data.constructor === Object){
        //no data returned
        res.send({"error": "Stock not found."});
        console.log("Sell request: " + symbol + " stock not found");
        return;
      }
      const price = data[symbol].price,
            exchange = data[symbol].exchange;

      //check if the markets are closed
      let date = new Date(new Date().getTime()+ new Date().getTimezoneOffset()*60*1000 + -300*60*1000); //get current time in EST (new york time)
      let minutes = date.getMinutes() + date.getHours()*60; //get how many minutes in the day that has elapsed

      if(!(date.getDay() % 6)) res.send({"error": "Cannot sell on the weekend"});
      else if(minutes < 540) res.send({"error": "Cannot sell, Market still closed. Opens in " + (540 - minutes) + " minutes."}); //check if its 9:30 EST
      else if(minutes > 960) res.send({"error": "Cannot sell, Market has closed " + (minutes - 960) + " minutes ago."}); //check if its past 16:00 EST
      else {
        //finally confirm the buy
        user.getName(apikey, res, function(username) {
          user.account.getInfo(username, res, function(userData) {
            let cash = userData.cash,
                loan = userData.loan;

            //get all rows in the portfolio that match the stock symbol
            user.portfolio.getRows(username, res, symbol, "stock", function(result) {
              //check if there is enough quantity to Sell
              let availableQuantity = 0;
              for( row of result ) {
                availableQuantity += row.quantity;
              }

              //set quantity if percent is more than 0
              if(percent > 0) {
                quantity = Math.ceil( availableQuantity * percent );
              }
              let totalValue = price * quantity - 25;

              //check if quantity wanted to sold is more than availabe quantity
              if(quantity > availableQuantity) {
                res.send({"error": "Not enough stock to sell."});
                console.log(username + " tried to sell " + quantity + " amount of " + symbol + " stock");
                return;
              }

              //now update the portfolio
              let remainingQuantity = quantity;
              for( row of result ) {
                //loop through all the rows
                if(row.quantity <= remainingQuantity) {
                  //if the row contains less stock than the amount of stock remaining to be sold, delete the row
                  user.portfolio.delete(username, res, row.id); //delete the row by searching for the row id
                  remainingQuantity -= row.quantity;
                } else if(remainingQuantity>0) {
                  //if there will be leftover stock
                  user.portfolio.update(username, res, row.id, row.quantity - remainingQuantity, function () {});
                  break;
                }

              }

              //after all these updates, now we have to add cash to the account!
              let newLoan = loan + totalValue,
                  newCash;

              if(newLoan > 50000) {
                newCash = cash + (newLoan - 50000);
                newLoan = 50000;
              } else {
                newCash = cash;
              }

              user.account.update(username, res, {
                cash: newCash,
                loan: newLoan,
              }, function () {
                //now insert into history

                user.history.add(username, res, {
                  symbol: symbol,
                  exchange: exchange,
                  quantity: quantity,
                  price: price,
                  action: "sell"
                }, function () {

                  //send success confirmation to client
                  res.send({
                    "success": "Stock successfully sold",
                    "info": {
                      "stock": symbol,
                      "price": price,
                      "quantity": quantity,
                      "totalValue": totalValue
                    }
                  });

                });
              });

            })
          });
        });
      }
    })
  }
}
