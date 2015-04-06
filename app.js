//DEPENDENCIES
// dependencies
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var routes = require('./routes');

var app = express();

//HEADERS
app.use(function(req, res, next) {
	res.set('Access-Control-Allow-Origin', 'http://localhost:8100');
	res.set('Access-Control-Allow-Headers',
	 "Origin, X-Requested-With, Content-Type, Accept");
	res.set('Access-Control-Allow-Credentials', true);
	res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
	next()
});

//CONFIGURE APP
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('express-session')({
    secret: 'MTBIKER',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);

// passport config
var User = require('./models').User;
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


var Recipe = require('./models').Recipe;

// RECIPE STATS SERVICE
var getStats = function() {
	Recipe.find(function(err, recipes) {
		recipes.forEach(function(recipe) {
			User.find({tryList: recipe._id}, function(err, users) {
				recipe.stats.forks = users.length;
				recipe.save();
			})
			User.find({'myBook.r_id': recipe._id}, function(err, users) {
				recipe.stats.books = users.length;
				recipe.save();
			})
		})
	});
};

var interval = 1 * 60 * 1000;
setInterval(function() {
	getStats();

},interval);



//MONGOOSE/DB CONNECTION
mongoose.connect('mongodb://localhost/recipeApp');




app.listen(8888);

