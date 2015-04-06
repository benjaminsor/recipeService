var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var Recipe = new Schema({
    name: { type: String, required: true },
	image: String,
	ingredients: [String],
	directions: [String],
	category: String,
	ethnicity: String,
	tags: [String],
	notes: String,
	userName: String,
	rating: Number,
	source: String,
	comments: [
		{
			user: String,
			date: Date,
			content: String
		}
	]
});

Recipe.plugin(passportLocalMongoose);

module.exports = mongoose.model('recipes', Recipe);