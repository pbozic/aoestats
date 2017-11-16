"use strict";
const db = require('../mongoose.js');
const Log = require("unklogger");
let Civ = db.Civ;
let Civstring = "Britons Byzantines Celts Chinese Franks Goths Japanese Mongols Persians Saracens Teutons Turks Vikings Aztecs Huns Koreans Mayans Spanish Incas Indians Italians Magyars Slavs Berbers Ethiopians Malians Portuguese Burmese Khmer Malay Vietnamese";
let Civs = Civstring.split(" ");

async function run() {
	for (let civ of Civs) {
		let result = await saveCiv(civ);
		console.log(result.name);
	}
}


async function saveCiv(name, image = ""){
	let civ = {
		name: name,
		image: image
	};
	let a = await Civ.findOneAndUpdate({ name: name }, civ, {upsert: true, new:true});
	return a;
};

run().catch(error => console.error("error.stack"));