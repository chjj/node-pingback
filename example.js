// There are two ways of dealing with pingbacks
// the first way is to do all error handling at the end
// on the `end` event. This simplifies things because 
// you can perform operations like checking to see
// if the pinged article exists, etc, and inserting 
// the pingback in one fell swoop.
// the downside is, if its a bad pingback, you will have 
// made a needless request to get to that `end` event.
// see the code for more info.
app.use('/pingback', function(req, res, next) {
  var ping = new Pingback(req, res); 
  req.pipe(ping);
  ping.on('fault', function(code, msg) {
    next(new Error(
      'Received bad pingback from ' 
      + this.source.href + '.' 
      + ' Fault Code: ' + code
      + ' - Message: ' + msg
    ));
  });
  ping.on('error', next);
  ping.on('end', function(source, target, next) { 
    Posts.get(source.pathname, function(err, post) {
      if (err) {
        return next(Pingback.TARGET_DOES_NOT_EXIST); 
      }
      if (post.pingbacks[source.href]) { // contrived example
        return next(Pingback.ALREADY_REGISTERED);
      }
      if (post.pingbacksDisabled) {
        return next(Pingback.TARGET_CANNOT_BE_USED); 
      }
      // insert a new pingback
      post.pingbacks.push({
        from: source.href, // e.g. "http://domain.tld/hey_check_out_this_guys_post"
        text: excerpt // e.g. "hey, check this out: <a href="your_site">...</a>"
      });
      post.save();
      next(); // respond with a success code
    });
  });
});

// NOTE: if you dont care about the semantics of fault codes
// you can pass a zero into next for a generic fault

// this way is a bit more complex, but it is technically how 
// pingbacks are supposed to be done. you can bind to a
// `ping` event. as soon as the source and target uri's
// have been parsed, this event will be emitted. you can 
// do your error handling there, and call the `next` function
// pass in an error code if necessary, otherwise pass no arguments 
// at all. the error you pass in must be a valid fault code int.
app.use('/pingback', function(req, res, next) {
  var post, ping = new Pingback(req, res); 
  req.pipe(ping);
  ping.on('ping', function(source, target, next) {
    Posts.get(source.pathname, function(err, data) {
      post = data;
      if (err) {
        return next(Pingback.TARGET_DOES_NOT_EXIST); 
      }
      if (post.pingbacks[source.href]) { // contrived example
        return next(Pingback.ALREADY_REGISTERED);
      }
      if (post.pingbacksDisabled) {
        return next(Pingback.TARGET_CANNOT_BE_USED); 
      }
      next(); // respond with a success code
    });
  });
  ping.on('fault', function(code, msg) {
    next(new Error(
      'Received bad pingback from ' 
      + this.source.href + '.' 
      + ' Fault Code: ' + code
      + ' - Message: ' + msg
    ));
  });
  ping.on('error', next);
  ping.on('success', function(source, target) { // maybe just have one end/success event?
    console.log('Successful pingback from: ' + source.href);
    console.log('Page title:', this.title);
    console.log('Excerpt: ' + this.excerpt);
    // insert a new pingback
    post.pingbacks.push({
      from: source.href, // e.g. "http://domain.tld/hey_check_out_this_guys_post"
      text: excerpt // e.g. "hey, check this out: <a href="your_site">...</a>"
    });
    post.save();
  });
});

// the middleware bundled with node-pingback will abstract away certain
// things and allow you to do no error handling at all
// the middleware callback can optionally take a third argument, which 
// is another `next` function, allowing you to pass in a fault code,
// or nothing for a success response.
app.use('/pingback', Pingback.middleware(function(source, target) {
  Posts.get(source.pathname, function(err, post) {
    if (err) return;
    post.pingbacks.push({
      from: source.href, // e.g. "http://domain.tld/hey_check_out_this_guys_post"
      text: excerpt // e.g. "hey, check this out: <a href="your_site">...</a>"
    });
    post.save();
  });
});

// fault code constants
Pingback.METHOD_NOT_FOUND = -32601;
Pingback.GENERAL_ERROR = 0;
Pingback.SOURCE_DOES_NOT_EXIST = 16;
Pingback.NO_LINK_TO_TARGET = 17;
Pingback.TARGET_DOES_NOT_EXIST = 32;
Pingback.TARGET_CANNOT_BE_USED = 33;
Pingback.ALREADY_REGISTERED = 48;
Pingback.ACCESS_DENIED = 49;

// Pingback properties
`source` - a parsed url object of the source
`target` - a parsed url object of the target
`excerpt` - an excerpt from the source's page
`title` - the title of the source page

// sending pingbacks

// err will be whatever fault code was sent
Pingback.send('[target]', '[source]', function(err, pingback) {
  if (!err) console.log('Pinged ' + pingback.href + ' successfully.');
});

// .send scans the text and looks for links
// if it finds any links with a differing domain
// from the source url, it dispatches pingback requests
// the second parameter is the SOURCE URL, not the target url
// in a lot of cases, it might just be req.url
// you will want to call this after posting an article on your blog
var text = 'some links here <a href="">etc</a>';
Pingback.scan(text, 'http://domain.tld/my-post', function(err, pingback) {
  // optional callback - will get called for every pingback sent
  if (!err) console.log('Pinged ' + pingback.href + ' successfully.');
});