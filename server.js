var marked = require('marked');

var connect = require('connect');
var serveStatic = require('serve-static');
var app = connect();

//静的コンテンツを返せる
app.use(serveStatic(__dirname + '/private'));

app.listen(8080);
console.log('Server running on 8080');

app.use(function(req, res, next){
  res.writeHead(200, {'Content-Type':'text/html'});
  res.write('<h1>Hello Connect Server</h1>');

  res.write(marked('## hoge'));


  next();
  res.end('<hr/>footer');
});
app.use('/foo', function (req, res, next) {
  res.write('foo');
  next();
});
app.use('/bar', function (req, res, next) {
  res.write('bar');
  next();
});
