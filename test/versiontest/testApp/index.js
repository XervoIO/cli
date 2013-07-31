var http = require('http');
var server = http.createServer(function(req, res) {
  res.writeHead(200, { 'Content-Type' : 'text/plain'} );
  res.write(process.version);
  res.end();
});
server.listen(8080);
console.log(process.version);
console.log(process.versions);
console.log(process.env);
console.log('Server running at http://127.0.0.1:8080/');


