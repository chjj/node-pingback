# node-pingback

Pingbacks have come to node.js. If you're writing a blog, you may be interested 
in this. It conforms to the 
[pingback specification](http://www.hixie.ch/specs/pingback/pingback), as well 
as the XML-RPC spec, however, it may need more testing. 

It protects against spam, has no dependencies, and can be used right out of 
the box. Connect/Express middleware is included.

## Usage

### Receiving Pingbacks (contrived example for clarity)

``` js
app.use('/pingback', Pingback.middleware(function(source, target, next) {
  Posts.get(source.pathname, function(err, post) {
    if (err) {
      return next(Pingback.TARGET_DOES_NOT_EXIST); 
    }
    if (post.pingbacks[source.href]) { 
      return next(Pingback.ALREADY_REGISTERED);
    }
    if (post.pingbacksDisabled) {
      return next(Pingback.TARGET_CANNOT_BE_USED); 
    }
    // or pass zero above for a generic error
    post.pingbacks.push({
      from: source.href, // e.g. "http://domain.tld/hey_check_out_this_guys_post"
      text: excerpt // e.g. "hey, check this out: <a href="your_site">...</a>"
    });
    post.save();
    next(); // send a success response
  });
});
```

What you see above is merely the abstracted interface of the bundled middleware.
See example.js for more in-depth and lower-level examples.

#### Fault Code Constants

``` js
Pingback.METHOD_NOT_FOUND = -32601;
Pingback.GENERAL_ERROR = 0;
Pingback.SOURCE_DOES_NOT_EXIST = 16;
Pingback.NO_LINK_TO_TARGET = 17;
Pingback.TARGET_DOES_NOT_EXIST = 32;
Pingback.TARGET_CANNOT_BE_USED = 33;
Pingback.ALREADY_REGISTERED = 48;
Pingback.ACCESS_DENIED = 49;
```

### Sending Pingbacks

``` js
// ping a target
// err will be whatever fault code was sent
Pingback.send('[target]', '[source]', function(err, pingback) {
  if (!err) console.log('Pinged ' + pingback.href + ' successfully.');
});

// scan text for links to ping
var text = 'some links here <a href="http://localhost:9000/article">etc</a>';
Pingback.scan(text, 'http://domain.tld/my-post', function(err, pingback) {
  // optional callback - will get called for every pingback sent
  if (!err) console.log('Pinged ' + pingback.href + ' successfully.');
});
```

Again, see example.js for more examples and explanation.

## License
(c) Copyright 2011, Christopher Jeffrey (MIT License)
See LICENSE for more info.