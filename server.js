var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');

app.listen(8081);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

// http://stackoverflow.com/a/19463874
io.sockets.on('connection', socket => {

    socket.on('subscribe', data => { 
      socket.join(data.room); 
    });

    socket.on('position', data => {
      console.log(data);
      socket.broadcast.emit('position', data);
    });

});