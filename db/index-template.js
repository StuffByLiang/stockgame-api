const mysql = require('mysql');

//create the mySQL connection
const con = mysql.createConnection({
  host: "",
  user: "",
  password: "",
  database: "",
  multipleStatements: true
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

module.exports = con;
