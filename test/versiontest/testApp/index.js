var http = require('http');
var server = http.createServer();
var handleReq = function(request, response){
  response.writeHead(200, {'Content-Type': 'text/plain'});
  response.end(process.version);
};
server.on('request', handleReq);
server.listen(process.env.PORT || 8124);
console.log(process.version);
console.log(process.versions);
console.log('Server running at http://127.0.0.1:8124/');


