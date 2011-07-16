var Pingback = require('../lib/pingback')
  , express = require('express');

var source = express.createServer()
  , target = express.createServer();

source.use(source.router);
target.use(target.router);

source.get('/source', function(req, res) {
  console.log('received request for source');
  res.send('hey, check out: <a href="http://127.0.0.1:4000/target">click here</a>');
});

target.get('/target', function(req, res, next) {
  res.header('X-Pingback', '/pingback');
  console.log('received request for target');
  res.send('heres my article');
});

var ping = Pingback.middleware(function(source, target) {
  console.log('Successful pingback from: ' + source.href);
  console.log('Page title:', this.title);
  console.log('Excerpt: ' + this.excerpt);
});

target.use('/pingback', ping);
target.use(function(err, req, res, next) {
  console.log(err.stack || err + '');
});

setTimeout(function() {
  Pingback.send('http://127.0.0.1:4000/target', 'http://127.0.0.1:3000/source', function(err, pingback) {
    if (err) return console.log('send error:', err.stack || err + '');
    console.log('Sent pingback to ' + pingback.href);
  });
}, 3000);

source.listen(3000);
target.listen(4000);