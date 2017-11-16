"use strict";
const db = require('./mongoose.js');
const Types = require("mongoose").Types;
const Log = require("unklogger");
const Koa = require('koa');
const Router = require('koa-router');
const koaBody = require('koa-bodyparser');
var cors = require('kcors');

const app = new Koa();
const router = new Router();

app.use(cors());
app.use(koaBody());
app.use(router.routes());
app.use(router.allowedMethods());




router.get('/getCivs', async function (ctx, next) {
  ctx.body = await db.Civ.find({});
});

router.get('/getPlayers', async function (ctx, next) {
	ctx.body = await db.Player.find({});
});

router.get('/tournament', async function (ctx, next) {
	ctx.body = await db.Tournament.findOne({name:"KOTD"})
	.populate('rounds.matchups.players.player')
	.populate('rounds.matchups.players.civs')
	.populate({
		path: "rounds.matchups.matches",
		populate: [{ path: 'players.civ' }, { path: 'players.player' }],
	})
	.populate("winner")
	.exec();
});

router.get('/tournamentNew', async function (ctx, next) {
	let tournament = {
		name: "KOTD",
	}
	let result = await db.Tournament.findOneAndUpdate({ name: tournament.name }, tournament, {upsert: true, new:true});
	console.log(result);
	ctx.body = result;
});

router.post('/addRound', async function (ctx, next) {
	let tournament = {
		name: "KOTD",
	}
	let result = await db.Tournament.findOne({ name: tournament.name });
	result.rounds.push({name: ctx.request.body.round.name});
	result = await result.save();
	ctx.body = result;
});
router.post('/addMatchup', async function (ctx, next) {
	let request = ctx.request.body;
	console.log(ctx.request.body);
	let result = await db.Tournament.findOne({ "rounds._id": ctx.request.body.round });
	let round = result.rounds.findIndex((x) => {
		return x._id == ctx.request.body.round
	});
	if (round == -1) {
		ctx.body = "Error"
	}
	result.rounds[round].matchups.push(ctx.request.body.matchup);
	result = await result.save();
	let res = await db.Tournament.findOne({ "rounds._id": ctx.request.body.round }).populate('rounds.matchups.players.player')
	.populate('rounds.matchups.players.civs')
	.populate("rounds.matchups.matches")
	.populate("winner")
	.exec();
	ctx.body = res;
});
router.post('/addMatch', async function (ctx, next) {
	let matchupId = ctx.request.body.matchup;
	let game = ctx.request.body.game;
	let roundId = ctx.request.body.round;
	let result = await db.Tournament.findOne({ "rounds._id": roundId });
	let round = result.rounds.findIndex((x) => x._id == roundId);
	if (round == -1) {
		ctx.body = "Error"
	}
	let matchup = result.rounds[round].matchups.findIndex((x) => x._id == matchupId);
	game._id = Types.ObjectId();
	let match = new db.Match(game);
	match = await match.save();
	result.rounds[round].matchups[matchup].matches.push(match._id);
	result = await result.save();
	let res = await db.Tournament.findOne({ "rounds._id": roundId }).populate('rounds.matchups.players.player')
	.populate('rounds.matchups.players.civs')
	.populate("rounds.matchups.matches")
	.populate("winner")
	.exec();
	ctx.body = res;
});

router.get('/getPlayedCivsStats', async function (ctx, next) {
	let matches = await db.Match.find().populate("players.player").populate("players.civ");
	console.log(matches);
	let civs = await db.Civ.find().select({ "name": 1, "_id": 0});
	let civis = {};
	for (let c of civs) {
		civis[c.name] = {
			played: 0,
			wins: 0,
		}
	}
	for (let m of matches) {
		for(let p of m.players) {
			civis[p.civ.name].played++;
			if(p.winner) {
				civis[p.civ.name].wins++;
			}
		}
	}
	ctx.body = civis;
});
router.get('/getPlayedCivsStatsChart', async function (ctx, next) {
	let matches = await db.Match.find().populate("players.player").populate("players.civ");
	console.log(matches);
	let civs = await db.Civ.find().select({ "name": 1, "_id": 0});
	let labels = civs.map((x) => x.name);
	let civis = {};
	let data = {
		labels: labels,
		datasets: [
			{
				label: 'Civ Won',
				backgroundColor: '#2980b9',
				data: []
			},
			{
				label: 'Civ Played',
				backgroundColor: '#8e44ad',
				data: []
			}
		],
	}
	for (let c of civs) {
		civis[c.name] = {
			played: 0,
			wins: 0,
		}
	}
	for (let m of matches) {
		for(let p of m.players) {
			civis[p.civ.name].played++;
			if(p.winner) {
				civis[p.civ.name].wins++;
			}
		}
	}
	for (let c of labels) {
		let civilisation = civis[c];
		data.datasets[0].data.push(civilisation.wins);
		data.datasets[1].data.push(civilisation.played);
	}
	ctx.body = data;
});
router.get('/getPickedCivsStatsChart', async function (ctx, next) {
	let tournament = await db.Tournament.findOne({name: "KOTD"}).populate('rounds.matchups.players.player')
	.populate('rounds.matchups.players.civs')
	.populate("rounds.matchups.matches")
	.populate("winner")
	.exec();
	let civs = await db.Civ.find().select({ "name": 1, "_id": 0});
	let labels = civs.map((x) => x.name);
	let civis = {};
	let data = {
		labels: labels,
		datasets: [
			{
				label: 'Civ Won',
				backgroundColor: '#2980b9',
				data: []
			},
			{
				label: 'Civ Picked',
				backgroundColor: '#8e44ad',
				data: []
			}
		],
	}
	let picks = {}
	for (let c of labels) {
		picks[c] = {
			picks: 0,
			wins: 0,
		}
	}
	for (let r of tournament.rounds) {
		for (let mu of r.matchups) {
			for (let p of mu.players) {
				for (let c of p.civs) {
					if (picks[c.name] == null) {
						picks[c.name] = {};
						if(picks[c.name].picks == null){
							picks[c.name].picks = 0;
						}
					}
					picks[c.name].picks++;
					let playerId = p.player._id;
					let match = mu.matches.filter((m) => {
						for (let pl of m.players) {
							if(pl.player.toString() == playerId.toString()) {
								if (pl.civ.toString() == c._id.toString()) {
									if (pl.winner == 1) {
										return true;
									}
								}
							}
						}
					});
					if (match.length > 0) {
						if(picks[c.name].wins == null){
							picks[c.name].wins = 0;
						}
						picks[c.name].wins++;
					}
				}
			}
		}
	}
	for (let c of labels) {
		let civilisation = picks[c];
		data.datasets[0].data.push(civilisation.wins);
		data.datasets[1].data.push(civilisation.picks);
	}
	ctx.body = data;
});
app.listen(9090);
