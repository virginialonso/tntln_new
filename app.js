'use strict';

var express = require("express");
var flash = require('connect-flash');
var async = require("async");
var redis = require("redis");
var ejs = require("ejs");
var http = require('http');
var RedisStore = require("connect-redis")(express);
var passport = require("passport");
var LocalStrategy = require('passport-local').Strategy;
var Post = require('./models').Post();
var User = require('./models').User();


var store;
if (process.env.REDISTOGO_URL) {
	var rtg   = require("url").parse(process.env.REDISTOGO_URL);
	store = redis.createClient(rtg.port, rtg.hostname);
	store.auth(rtg.auth.split(":")[1]);
} else {
	store = redis.createClient();
}

var app = module.exports = express();

app.configure(function () {
  app.set("views", __dirname + "/views");
  app.set("view engine", "ejs");
  app.engine("html", ejs.renderFile);
  app.use(express.bodyParser({uploadDir: './static/uploads', keepExtensions: true}));
  app.use(express.cookieParser("alskjald0q9udqokwdmqldiqud0woqijdklq09"));
  app.use(express.session({ store: new RedisStore({client: store}) }));
  app.use(express.methodOverride());
  app.use(express.static(__dirname + "/static"));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
});

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(
  function (username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (user.password !== password) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

function loadUser (req, res, next) {
  res.locals.user = req.user;
  next();
}

app.get("/", loadUser, function (req, res) {
  Post.find({}).sort('-last_edit').exec(function(err, docs) {
    res.locals.posts = docs;
    res.render("index");
  });
});

app.get("/about", function (req, res) {
  return res.render("about");
});

app.get("/flowers", function (req, res) {
  return res.render("flowers");
});

app.get("/login", function (req, res) {
  return res.render("login");
});
app.post('/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login' }
  )
);

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

app.get("/post/:id", loadUser, function(req, res) {
  var id = req.params.id;
  
  Post.findById(req.params.id, function(err, doc) {
    res.locals.data = doc;
    if (!doc) return res.redirect('/');
    res.render('post');
  });
});

app.get("/edit/:id", loadUser, function(req, res) {
  if (!req.user) return res.redirect("/");
  
  var id = req.params.id;
  Post.findById(req.params.id, function(err, doc) {
    res.locals.data = doc;
    if (!doc) return res.redirect('/');
    res.render('edit');
  });
});

app.del("/post/:id", loadUser, function(req, res) {
  if (!req.user) return res.json(500, {error:"Not allowed"});
  
  Post.findById(req.params.id).remove();
  return res.json({message:"Accomplished"});
});

app.post("/post/:id", loadUser, function(req, res) {
  if (!req.user) return res.json(500, {error:"Not allowed"});

  Post.findById(req.params.id).exec(function(err, doc){
    if (err || !doc) res.json(500, {error: "Not saved"});
    
    doc.title = req.body.title;
    doc.post = req.body.post;
    doc.save(function(err) {
      if (err) res.json(500, {error: "Not saved"});
      
      res.json(doc);
    })
  });
});

app.post("/new", loadUser, function(req, res) {
  if (!req.user) return res.json(500, {error:"Not allowed"});

  var doc = new Post({
    title: req.body.title,
    post: req.body.post
  });
  doc.save(function(err){
    if (err) res.json(500, {error: "Not saved"});
    
    return res.json(doc);
  });
});

app.get('*', loadUser, function(req, res){
  res.redirect("/");
});

var port = process.env.PORT || 1200;
var server = http.createServer(app).listen(port, function () {
	console.log("Virginialonso server listening on ", server.address().port, app.settings.env);
});


User.findOne({username: 'bing'}, function (err, doc) {
  if (!doc) {
    doc = new User({
      username: 'bing',
      password: 'pass'
    }).save(function (err, doc) {
      console.log('Creating test user test:pass', err);
    });
	}
});