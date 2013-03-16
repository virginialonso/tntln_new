'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

if (!this.db) {
  // this.db = "mongodb://localhost/90io" || "mongodb://heroku:master@alex.mongohq.com:10039/app9239381";
  this.db = process.env.MONGOHQ_URL || "mongodb://heroku:master@alex.mongohq.com:10039/app9239381";
  this.db = mongoose.connect(this.db);
}

var postSchema = new Schema({
  title: String,
  post: String,
  last_edit: { type: Date, default: Date.now }
});

var userSchema = new Schema({
  created_at: { type: Date, default: Date.now },
  username: String,
  password: String
});


mongoose.model("Post", postSchema);
mongoose.model("User", userSchema);

exports.Post = function () { return this.db.model("Post"); };
exports.User = function () { return this.db.model("User"); };