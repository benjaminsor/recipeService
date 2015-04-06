var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
    username: {type: String, unique: true},
	password: String,
	firstName: String,
	lastName: String,
	email: String,
	tryList: [String],
	myBook: [
		{
			r_id: String,
			userNotes: String
		}
	],
	following: [String],
	followers: [String],
	description: String
});

User.plugin(passportLocalMongoose);

var Recipe = new Schema({
    name: { type: String, required: true },
	image: String,
	ingredients: [String],
	directions: [String],
	category: String,
	ethnicity: String,
	meal: String,
	tags: [String],
	notes: String,
	stats: {
		forks: Number,
		books: Number
	},
	username: String,
	source: String,
	date: Date,
	comments: [
		{
			user: String,
			date: Date,
			content: String
		}
	]
});

Recipe.plugin(passportLocalMongoose);

var Feed = new Schema({
	username: String,
	date: Date,
	recipe: {type: ObjectId, ref:'recipes'},
	user: String,
	action: String  // 5 options: FORK, ADD, COMMENT, BOOK, FOLLOW
});

module.exports = {
	Recipe: mongoose.model('recipes', Recipe),
	User: mongoose.model('users', User),
	Feed: mongoose.model('feed', Feed)
};

