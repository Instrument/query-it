var keypress = require('keypress');
var fs = require('fs');
var argv = require('yargs').argv;
var play = require('play');
var Sound = require('node-aplay');
var WebSocket = require('ws');
var ws;

var SOUNDS = require('./src/scripts/events/sounds.js');
var running = '';
var singleCharRegex = new RegExp(/^[a-zA-Z0-9`=-]$/)
var end = false;
var reconnectTimeout;

function playSound(sound) {
  sound = __dirname + '/wavs/' + sound + '.wav';
  console.log(sound);
  if (argv.pi) {
    new Sound(sound).play();
  } else {
    play.sound(sound);
  }
}

function connectToServer() {
  console.log('trying to connect');

  ws = new WebSocket('ws://' + (argv.host || '10.0.0.5') + ':' + (argv.port || '8095'));
  ws.on('error', function(e) {
    console.log('cant connect');
    reconnectTimeout = setTimeout(
      connectToServer, 1000
    );
  });
  setupSocket();
}

function setupSocket() {
  ws.on('close', function close() {
    console.log('disconnected');
    running = '';
    reconnectTimeout = setTimeout(
      connectToServer, 1000
    );
  });

  ws.on('open', function() {
    console.log('connected');
    clearTimeout(reconnectTimeout);
    ws.on('message', function(data) {
      var message = JSON.parse(data);
      if (message.event === 'clear') {
        end = false;
        running = '';
      } else if (message.event === 'logError') {
        fs.appendFile('logs/big-query-errors.txt', data, function(){ console.log('error saved'); });
      } else if (message.event === 'sound' && (message.data.clients.indexOf(argv.id) !== -1 || !argv.id)) {
        playSound(message.data.sound);
      }
    });
  });
}

connectToServer();

// make `process.stdin` begin emitting "keypress" events
keypress(process.stdin);

// listen for the "keypress" event
process.stdin.on('keypress', function (ch, key) {
  if (key) {
    if (!end) {
      end = (key.name == 'return');
    }
    if (singleCharRegex.exec(key.name)) {
      running += ch;
    }
    if (key.name == 'space') {
      running += ' ';
    } else if (key.name == 'backspace') {
      running = running.slice(0, running.length - 1);
    }

    if (end) {
      // running = '';
    }

    if (key && key.ctrl && key.name == 'c') {
      process.exit(0);
    }
  } else if (singleCharRegex.exec(ch)) {
    ch = ch.replace('`', '#');
    ch = ch.replace('=', '+');
    running += ch;
  }

  ws.send(JSON.stringify({
    event: 'playerInput',
    data: {
    'running': running,
    'submitted': end,
    'client': argv.id,
    }
  }));

});

process.stdin.setRawMode(true);
process.stdin.resume();
