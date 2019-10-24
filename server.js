/*
I didn't want to do what I wanted to do in the last four years.
Liang in the future - never stop procrasitnating. Don't give up on your hopes and passions.
Do not forget your ambitions. You have your whole life ahead of you.

https://www.reddit.com/r/GetMotivated/comments/2xc947/text_soon_i_will_be_gone_forever_but_thats_okay/
 */
const express = require("express");
const bodyParser = require("body-parser");

const app = express();

const port = 3000;

// Add headers
app.use(function (req, res, next) {

    bodyParser.urlencoded({ extended: true });

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8888');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

require('./api/routes')(app);

app.listen(port, () => {
 console.log("Server running on port 3000");
});
