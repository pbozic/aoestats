"use strict";
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/aoe', { useMongoClient: true });
