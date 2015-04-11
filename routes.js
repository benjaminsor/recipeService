var express = require('express');
var passport = require('passport');
var cheerio = require('cheerio');
var request = require('request');
var multer  = require('multer');
var User = require('./models').User;
var Recipe = require('./models').Recipe;
var Feed = require('./models').Feed;
var router = express.Router();

// MIDDLEWARE TO PROTECT ROUTES AGAINST NOT BEING SIGNED IN
var auth = function(req, res, next) { 
	if (!req.isAuthenticated()) {
		res.send(401);  
	} else {
		next();
	}
}; 

// ROUTES FOR AUTHENTICATION
router.post('/api/create', function(req, res) {
	console.log(req.body);
    User.register(new User(
	    { 
	    	username : req.body.username, 
	    	firstName: req.body.firstName,
	    	lastName: req.body.lastName,
	    	email: req.body.email,
	    	description: req.body.description 
	    }
    ), req.body.password, function(err, user) {

        if (err) {
          return res.send("Sorry. That username already exists. Try again.");
        }
        passport.authenticate('local')(req, res, function () {
            res.send(req.user);
        });
    });
})
router.post('/api/login', passport.authenticate('local'), function(req, res) {
    res.send(req.user);
})
router.get('/api/logout', function(req, res) {
    req.logOut();
    req.session.destroy();
    res.send('logged out');
})
router.get('/api/loggedin', function(req, res) { 
	res.send(req.isAuthenticated() ? req.user : '0'); 
})


// ROUTES FOR FEED/ACTIVITY
router.get('/api/:username/feed', function(req, res) { 
	User.findOne({username: req.params.username}, function(err, user) {
		Feed.find({'username':{$in:user.following}}).sort('-date').limit(100).populate('recipe').exec(function(err, items) {  
			var data = {};
			items.forEach(function(item) {
				if(item.recipe) {
					if(data.hasOwnProperty(item.recipe._id)) {
						data[item.recipe._id].actions.push({
							username: item.username,
							date: item.date,
							action: item.action
						})
					} else {
						data[item.recipe._id] = {
							recipe: item.recipe,
							actions: [{
								username: item.username,
								date: item.date,
								action: item.action
							}]
						}
					}
				}
				
			})
			var theFeed = [];
			for (var item in data) {
				theFeed.push(data[item]);
			}
			res.send(theFeed);	
		})
	})
})
router.get('/api/:username/activity', function(req, res) {
	var activity = [];
	Feed.find().populate('recipe').sort('-date').limit(100).exec(function(err, items) {
		items.forEach(function(item) {
			if(item.action != 'FOLLOW' && item.recipe) {
				if(item.username != req.params.username && item.recipe.username == req.params.username) {
					activity.push(item);
				}
			} else if (item.action == 'FOLLOW' && item.user) {
				if(item.username != req.params.username && item.user == req.params.username) {
					activity.push(item);
				}
			}			
		})
		res.send(activity);
	})
})
router.post('/api/feed', function(req, res) {
	var item = new Feed(req.body);
	item.save(function(err) {
		if(!err) {
			return console.log('added');
		} else {
			return console.log(err);
		}
	})
	return res.send(item);
})
router.get('/api/feed', function(req, res) {
	Feed.find(function(err, feed) {
		res.send(feed);
	})
})
router.delete('/api/feed/:id', function(req, res){
  return Feed.findById(req.params.id, function (err, feed) {
    return feed.remove(function(err) {
      if (!err) {
        console.log("removed");
        return res.send('');
      } else {
        console.log(err);
      }
    })
  })
})


// ROUTES FOR RECIPES MODEL
router.get('/api/recipes', function(req, res) {
	Recipe.find(function(err, recipes) {
		res.send(recipes);
	})
})
router.get('/api/recipes/:id', function(req, res) {
	var recId = req.params.id;
	Recipe.findById(recId, function(err, recipe) {
		res.send(recipe);
	})
})
router.post('/api/recipes', function(req, res) {
  var recipe = new Recipe(req.body);
  recipe.save(function(err) {
    if (!err) {
      return console.log("created");
    } else {
      return console.log(err);
    }
  })
  return res.send(recipe);
})
router.put('/api/recipes/:id', function(req, res){
	Recipe.findById(req.params.id, function(err, recipe) {
	    recipe.name = req.body.name;
	    recipe.image = req.body.image,
	    recipe.ingredients = req.body.ingredients;
	    recipe.directions = req.body.directions;
	    recipe.category = req.body.category;
	    recipe.ethnicity = req.body.ethnicity;
	    recipe.tags = req.body.tags;
	    recipe.notes = req.body.notes;
	    recipe.username = req.body.username;
	    recipe.rating = req.body.rating;
	    recipe.source = req.body.source;
    recipe.save(function(err) {
		if (!err) {
			console.log("updated");
		} else {
			console.log(err);
		}
      	res.send(recipe);
    })
  })
})
router.put('/api/recipes/:id/comment', function(req, res){
	Recipe.findById(req.params.id, function(err, recipe) {
	    recipe.comments = req.body.comments;
	    recipe.save(function(err) {
			if (!err) {
				console.log("comment added!");
			} else {
				console.log(err);
			}
	      	res.send(recipe.comments);
	    })
  	})
})
router.delete('/api/recipes/:id', function(req, res){
  return Recipe.findById(req.params.id, function (err, recipe) {
    return recipe.remove(function(err) {
      if (!err) {
        console.log("removed");
        return res.send('');
      } else {
        console.log(err);
      }
    })
  })
})
router.get('/api/:username/bookRecipes', function(req, res) {
	var recipeIds = [];
	var theRecipes = [];
	User.findOne({username: req.params.username}, function(err, user) {
		for(var i = 0; i < user.myBook.length; i++) {
			recipeIds.push(user.myBook[i].r_id);
		}
	})
	Recipe.find(function(err, recipes) {
		for (var r = 0; r < recipes.length; r++) {
			for (var i = 0; i < recipeIds.length; i++) {
			 	if (recipes[r]._id == recipeIds[i]) {
					theRecipes.push(recipes[r]);
			 	}
			}
		}
		res.send(theRecipes)
	}) //ToDo: clean this up to populate in users model
})
router.get('/api/:username/forkRecipes', function(req, res) {
	var recipeIds = [];
	var theRecipes = [];
	User.findOne({username: req.params.username}, function(err, user) {
		for(var i = 0; i < user.tryList.length; i++) {
			recipeIds.push(user.tryList[i]);
		}
	})

	Recipe.find(function(err, recipes) {
		for (var r = 0; r < recipes.length; r++) {
			for (var i = 0; i < recipeIds.length; i++) {
			 	if (recipes[r]._id == recipeIds[i]) {
					theRecipes.push(recipes[r]);
			 	}
			}
		}
		res.send(theRecipes)
	}) //ToDo: clean this up to populate in users model
})
router.get('/api/search-recipes/:search', function(req, res) {
	var regex = new RegExp('^.*' + req.params.search + '.*$', 'i');
	Recipe.find(
          { $or: [{name: regex},
          {ingredients: regex},
          {directions: regex},
          {category: regex},
          {ethnicity: regex},
          {meal: regex},
          {tags: regex},
          {notes: regex}
      ]}, function(err, q) {
		res.send(q);
	});
})




// ROUTES FOR USERS MODEL
router.get('/api/users', function(req, res) {
	User.find(function(err, users) {
		res.send(users);
	})
})
router.get('/api/users/:username', function(req, res) {

	User.findOne({username: req.params.username}, function(err, user) {
		res.send(user);
	})
})
router.post('/api/users', function(req, res) {
	var user = new User({
		userName: req.body.userName,
		password: req.body.password,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		email: req.body.email,
		description: req.body.description
	});
	user.save(function(err) {
		if(!err) {
			return console.log('created');
		} else {
			return console.log(err);
		}
	})
	return res.send(user);
})
router.put('/api/users/:id', function(req, res) {
	return User.findById(req.params.id, function(err, user) {
		user.username = req.body.username;
		user.password = req.body.password;
		user.firstName = req.body.firstName;
		user.lastName = req.body.lastName;
		user.email = req.body.email;
		user.tryList = req.body.tryList;
		user.myBook = req.body.myBook;
		user.following = req.body.following;
		user.followers = req.body.followers;
		user.description = req.body.description;
		return user.save(function(err) {
			if (!err) {
			  console.log("updated");
			} else {
			  console.log(err);
			}
			return res.send(user);
		})
	})
})
router.delete('/api/users/:id', function(req, res){
	return User.findById(req.params.id, function(err, user) {
		return user.remove(function(err) {
			if (!err) {
				console.log("removed");
				return res.send('');
			} else {
				console.log(err);
			}
		})
	})
})
router.get('/api/search-people/:search', function(req, res) {
	var regex = new RegExp('^.*' + req.params.search + '.*$', 'i');
	User.find({ 
		$or: [{username: regex},
          	{firstName: regex},
          	{lastName: regex},
          	{email: regex}]
    }, function(err, q) {
		res.send(q);
	});  //To Do: make this able to search first/last name combos
})



// SPECIALTY ROUTES
router.get('/api/scrape/:url', function(req, res) {

	var url = req.params.url;

	request(url, function(error, response, html) {
		if(!error) {
			var $ = cheerio.load(html);
			var data = {
				name: '',
				images: [],
				ingredients: []
			};

			data.name = $('body, html').find('h1').text();

			var images = $('body, html').find('img');
			images.each(function(i, elem) {
				if($(this).attr('src')) {
					var src = $(this).attr('src');
					var ext = src.split('.').pop().toLowerCase();
					var fileTypes = ['jpg','jpeg','png'];
					if(fileTypes.indexOf(ext) > -1 && src.indexOf('http') > -1){
						data.images.push(src);
					}
				}
			});

			
			var ing;
			if ( $('*:contains("Ingredients")').next('ul').length ) {
			 	ing = $('*:contains("Ingredients")').next('ul');
			 	console.log('1');
			} else if ( $('*:contains("Ingredients")').nextUntil('ul').next().length ) {
			 	ing = $('*:contains("Ingredients")').nextUntil('ul').next();
			 	console.log('2');
			} else if ( $('*:contains("Ingredients")').nextAll('ul').first().length ) {
			 	ing = $('*:contains("Ingredients")').nextAll('ul').first();
			 	console.log('3');
			} else if ( $('*:contains("Ingredients")').next().find('ul').first().length ) {
			 	ing = $('*:contains("Ingredients")').next().find('ul').first();
			 	console.log('4');
			} else if ( $('*:contains("Ingredients")').parent().find('ul').first().length ) {
			 	ing = $('*:contains("Ingredients")').parent().find('ul').first();
			 	console.log('5');
			} else {
			 	ing = null;
			 	console.log('6');
			}
						
						
			if (ing) {
			 	var ings = ing.children('li');

			 	ings.each(function(i, elem) {
			 		if($(this)) {
			 			data.ingredients.push($(this).text());
			 		}
			 	});
			}
			
			
			res.send(data);

		} else {
			res.send(error);
		}
	})
})
router.post('/api/file/upload', function(req, res) {
	res.send(req.files.name);
})


module.exports = router;