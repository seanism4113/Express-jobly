"use strict";
/** Database setup for jobly. */
const { Client } = require("pg");
const { getDatabaseUri } = require("./config");

let db;

// Configure the database client based on the environment
// * In production, SSL is enabled with `rejectUnauthorized: false` which allows connections to managed databases that may not provide certificates.
if (process.env.NODE_ENV === "production") {
	db = new Client({
		connectionString: getDatabaseUri(),
		ssl: {
			rejectUnauthorized: false,
		},
	});
} else {
	db = new Client({
		connectionString: getDatabaseUri(),
	});
}

db.connect();

module.exports = db;
