var argv = require('yargs').argv;
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: (argv.port || '8095') });
var fs = require('fs');
var ids = 0;

wss.on('connection', function connection(ws) {
  ws.id = ids++;
  ws.on('message', function incoming(message) {

    if(message.event === 'logError') {
      fs.appendFile('logs/big-query-errors.txt', data, function(){ console.log('error saved'); });
    }

    console.log('received: %s', message);
    wss.clients.forEach(function each(client) {
      client.send(message);
    });
  });

  //ws.send('something');
});
