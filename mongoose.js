"use strict";
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/aoe', { useMongoClient: true });
const db = mongoose.connection;
var Schema = mongoose.Schema;
db.on('error', console.error.bind(console, 'connection error:'));
let civSchema = mongoose.Schema({
	_id: Schema.Types.ObjectId,
	name: String,
	image: String,
});

let playerSchema = mongoose.Schema({
	_id: Schema.Types.ObjectId,
	name: String,
	vooblyId: String,
});

let matchSchema = mongoose.Schema({
	_id: Schema.Types.ObjectId,
	players: [{
		player: { type: Schema.Types.ObjectId, ref: 'Player' },
		civ: { type: Schema.Types.ObjectId, ref: 'Civ' },
		winner: Number,
	}],
});

let tournamentSchema = mongoose.Schema({
	name: String,
	rounds: [{
		name: String,
		matchups: [{
			players: [{
				player: { type: Schema.Types.ObjectId, ref: 'Player' },
				civs: [{ type: Schema.Types.ObjectId, ref: 'Civ' }],
				score: Number,
				winner: Number,
			}],
			matches: [{ type: Schema.Types.ObjectId, ref: 'Match' }]
		}],
	}],
	winner: { type: Schema.Types.ObjectId, ref: 'Player' },
	vooblyLink: String,
});

let Civ = mongoose.model('Civ', civSchema);
let Player = mongoose.model('Player', playerSchema);
let Match = mongoose.model('Match', matchSchema);
let Tournament = mongoose.model('Tournament', tournamentSchema);

module.exports = {
	Civ,
	Player,
	Match,
	Tournament
}




