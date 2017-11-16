






"use strict";
const db = require('../mongoose.js');
const Log = require("unklogger");
let Player = db.Player;
let playersString = "ACCM BacT Cloud DauT Edie F1re happyhappy Hearttt Janik Jordan_23 LaaaaaN Liereyy Lyx MbL Melkor MetalRTS miguel slam Spaden Spring St4rk Tatoh TheMax TheViper Tim Twigg Villese Vinchester vivi whoop Yellow Yo";
let Players = playersString.split(" ");

async function run() {
	for (let civ of Players) {
		let result = await saveCiv(civ);
		console.log(result.name);
	}
}


async function saveCiv(name){
	let player = {
		name: name,
	};
	let a = await Player.findOneAndUpdate({ name: name }, player, {upsert: true, new:true});
	return a;
};

run().catch(error => console.error(error.stack));