let mode = process.env.NODE_ENV;
if (mode === undefined) {
  if (process.env.npm_config_argv === undefined) {
    console.log('ERROR!!!!!! : confirm NODE_ENV');
    process.exit();
  }
  const args = JSON.parse(process.env.npm_config_argv);
  mode = args.original[1] || 'prod';
  process.env.NODE_ENV = mode;
}

console.log('======================================================================');
if (mode == 'prod') {
  console.log("Production Mode");
} else if (mode == 'stag') {
  console.log("Staging Mode");
} else if (mode == 'dev') {
  console.log("Development Mode");
}
console.log('======================================================================');

var express = require("express");
var app = express();
require('console-stamp')(console, {pattern: 'yyyy/mm/dd HH:MM:ss.l', metadata: `[${process.pid}]`});
var vastRoute = require("./routes/vast");
require('./routes/scheduler');

app.get("/",function(request, response){
    response.send("Hello World");
});
 
app.listen(3005, function(){
    console.log("Express app started on port 3005.");
});

// CORS 허용
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.use("/vast", vastRoute);