const getJSON = require('get-json');

/* Type eg. symbol, companyName, primaryExchange, sector, open, close, latestPrice, change, changePercent*/
module.exports.getStockInfo = function( symbol, callbackfn){
	getJSON( "https://api.iextrading.com/1.0/stock/market/batch?symbols=" + symbol.join() + "&types=quote,chart", function( error, data ) {
		var returnArray = {}; //initialize object

		for ( i in data) {
			i = data[i];
			returnArray[ i.quote.symbol ] = {} //initialize symbol of returnArray

			//return all da data
			switch(i.quote.primaryExchange){
				case "New York Stock Exchange":
					returnArray[ i.quote.symbol ].exchange = "NYSE";
					break;
				case "Nasdaq Global Select":
				case "NASDAQ Global Market":
					returnArray[ i.quote.symbol ].exchange = "NASDAQ";
			}

			returnArray[ i.quote.symbol ].longexchange = i.quote.primaryExchange;
			returnArray[ i.quote.symbol ].changePercentage = i.quote.changePercent * 100;
			returnArray[ i.quote.symbol ].price = i.quote.latestPrice;
			returnArray[ i.quote.symbol ].name = i.quote.companyName;
			returnArray[ i.quote.symbol ].change = i.quote.change;
			//returnArray[ i.quote.symbol ].chart = i.chart;
		}
		callbackfn(returnArray);
	});

}

module.exports.getCryptoInfo = function( symbol, callbackfn ){
	var returnArray = {}; //initialize object

	getJSON( "https://min-api.cryptocompare.com/data/pricemultifull?fsyms=" + symbol.join() + "&tsyms=USD", function( error, data ) {

		for ( i in data.RAW ) {
			i = data.RAW[i].USD;
			returnArray[ i.FROMSYMBOL ] = {}; //initialize symbol of returnArray

			returnArray[ i.FROMSYMBOL ].exchange = "cryptocurrency";


			returnArray[ i.FROMSYMBOL ].longexchange = "cryptocurrency";
			returnArray[ i.FROMSYMBOL ].changePercentage = i.CHANGEPCT24HOUR;
			returnArray[ i.FROMSYMBOL ].price = i.PRICE;
			returnArray[ i.FROMSYMBOL ].change = i.CHANGE24HOUR;
		}

		callbackfn(returnArray);
	});

}
