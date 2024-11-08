"use strict";

const db = require("../db.js");
const User = require("../models/user.js");
const Company = require("../models/company.js");
const Job = require("../models/job.js");
const { createToken } = require("../helpers/tokens.js");

async function commonBeforeAll() {
	// noinspection SqlWithoutWhere
	await db.query("DELETE FROM applications");
	// noinspection SqlWithoutWhere
	await db.query("DELETE FROM jobs");
	// noinspection SqlWithoutWhere
	await db.query("DELETE FROM companies");
	// noinspection SqlWithoutWhere
	await db.query("DELETE FROM users");

	// Reset sequence for the job table
	await db.query("ALTER SEQUENCE jobs_id_seq RESTART WITH 1");

	await Company.create({
		handle: "c1",
		name: "C1",
		numEmployees: 1,
		description: "Desc1",
		logoUrl: "http://c1.img",
	});
	await Company.create({
		handle: "c2",
		name: "C2",
		numEmployees: 2,
		description: "Desc2",
		logoUrl: "http://c2.img",
	});
	await Company.create({
		handle: "c3",
		name: "C3",
		numEmployees: 3,
		description: "Desc3",
		logoUrl: "http://c3.img",
	});

	await Job.create({
		title: "j1",
		salary: 10000,
		equity: null,
		companyHandle: "c1",
	});
	await Job.create({
		title: "j2",
		salary: 50000,
		equity: null,
		companyHandle: "c2",
	});
	await Job.create({
		title: "j3",
		salary: 100000,
		equity: "0.123",
		companyHandle: "c1",
	});

	await User.register({
		username: "u1",
		firstName: "U1F",
		lastName: "U1L",
		email: "user1@user.com",
		password: "password1",
		isAdmin: false,
	});

	await User.register({
		username: "u2",
		firstName: "U2F",
		lastName: "U2L",
		email: "user2@user.com",
		password: "password2",
		isAdmin: false,
	});

	await User.register({
		username: "u3",
		firstName: "U3F",
		lastName: "U3L",
		email: "user3@user.com",
		password: "password3",
		isAdmin: false,
	});

	await User.register({
		username: "admin",
		firstName: "adminFirst",
		lastName: "adminLast",
		email: "admin@user.com",
		password: "adminpass",
		isAdmin: true,
	});
}

async function commonBeforeEach() {
	await db.query("BEGIN");
}

async function commonAfterEach() {
	await db.query("ROLLBACK");
}

async function commonAfterAll() {
	await db.end();
}

const u1Token = createToken({ username: "u1", isAdmin: false });
const u3Token = createToken({ username: "u3", isAdmin: false });
const adminToken = createToken({ username: "admin", isAdmin: true });

module.exports = {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	u1Token,
	u3Token,
	adminToken,
};
