"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app.js");
const User = require("../models/user.js");

const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll, u1Token, u3Token, adminToken } = require("../testHelpers/_testRoutesCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /users */

describe("POST /users", function () {
	test("works for admin", async function () {
		const resp = await request(app)
			.post("/users")
			.send({
				username: "u-new",
				firstName: "First-new",
				lastName: "Last-newL",
				password: "password-new",
				email: "new@email.com",
				isAdmin: false,
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			user: {
				username: "u-new",
				firstName: "First-new",
				lastName: "Last-newL",
				email: "new@email.com",
				isAdmin: false,
			},
			token: expect.any(String),
		});
	});

	test("works for admin to create admin", async function () {
		const resp = await request(app)
			.post("/users")
			.send({
				username: "u-new",
				firstName: "First-new",
				lastName: "Last-newL",
				password: "password-new",
				email: "new@email.com",
				isAdmin: true,
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			user: {
				username: "u-new",
				firstName: "First-new",
				lastName: "Last-newL",
				email: "new@email.com",
				isAdmin: true,
			},
			token: expect.any(String),
		});
	});

	test("Unauthorized for not admin", async function () {
		const resp = await request(app)
			.post("/users")
			.send({
				username: "u-new",
				firstName: "First-new",
				lastName: "Last-newL",
				password: "password-new",
				email: "new@email.com",
				isAdmin: false,
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(403);
	});

	test("unauth for anon", async function () {
		const resp = await request(app).post("/users").send({
			username: "u-new",
			firstName: "First-new",
			lastName: "Last-newL",
			password: "password-new",
			email: "new@email.com",
			isAdmin: true,
		});
		expect(resp.statusCode).toEqual(401);
	});

	test("bad request if missing data", async function () {
		const resp = await request(app)
			.post("/users")
			.send({
				username: "u-new",
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});

	test("bad request if invalid data", async function () {
		const resp = await request(app)
			.post("/users")
			.send({
				username: "u-new",
				firstName: "First-new",
				lastName: "Last-newL",
				password: "password-new",
				email: "not-an-email",
				isAdmin: true,
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/************************************** GET /users */

describe("GET /users", function () {
	test("works for admin", async function () {
		const resp = await request(app).get("/users").set("authorization", `Bearer ${adminToken}`);
		expect(resp.body).toEqual({
			users: [
				{
					username: "admin",
					firstName: "adminFirst",
					lastName: "adminLast",
					email: "admin@user.com",
					isAdmin: true,
				},
				{
					username: "u1",
					firstName: "U1F",
					lastName: "U1L",
					email: "user1@user.com",
					isAdmin: false,
				},
				{
					username: "u2",
					firstName: "U2F",
					lastName: "U2L",
					email: "user2@user.com",
					isAdmin: false,
				},
				{
					username: "u3",
					firstName: "U3F",
					lastName: "U3L",
					email: "user3@user.com",
					isAdmin: false,
				},
			],
		});
	});

	test("Unauthorized for not admin", async function () {
		const resp = await request(app).get("/users").set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(403);
	});

	test("unauth for anon", async function () {
		const resp = await request(app).get("/users");
		expect(resp.statusCode).toEqual(401);
	});

	test("fails: test next() handler", async function () {
		// there's no normal failure event which will cause this route to fail ---
		// thus making it hard to test that the error-handler works with it. This
		// should cause an error, all right :)
		await db.query("DROP TABLE users CASCADE");
		const resp = await request(app).get("/users").set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(500);
	});
});

/************************************** GET /users/:username */

describe("GET /users/:username", function () {
	test("works for admin", async function () {
		const resp = await request(app).get(`/users/u1`).set("authorization", `Bearer ${adminToken}`);
		expect(resp.body).toEqual({
			user: {
				username: "u1",
				firstName: "U1F",
				lastName: "U1L",
				email: "user1@user.com",
				isAdmin: false,
				jobs: [],
			},
		});
	});

	test("works for owner", async function () {
		const resp = await request(app).get(`/users/u1`).set("authorization", `Bearer ${u1Token}`);
		expect(resp.body).toEqual({
			user: {
				username: "u1",
				firstName: "U1F",
				lastName: "U1L",
				email: "user1@user.com",
				isAdmin: false,
				jobs: [],
			},
		});
	});

	test("works when applications are submitted", async function () {
		await request(app).post(`/users/u1/jobs/1`).send({ username: "u1", jobId: 1 }).set("authorization", `Bearer ${u1Token}`);
		await request(app).post(`/users/u1/jobs/2`).send({ username: "u1", jobId: 2 }).set("authorization", `Bearer ${u1Token}`);
		const resp = await request(app).get(`/users/u1`).set("authorization", `Bearer ${u1Token}`);
		expect(resp.body).toEqual({
			user: {
				username: "u1",
				firstName: "U1F",
				lastName: "U1L",
				email: "user1@user.com",
				isAdmin: false,
				jobs: [
					{
						jobId: 1,
						title: "j1",
						salary: 10000,
						equity: null,
						companyHandle: "c1",
					},
					{
						jobId: 2,
						title: "j2",
						salary: 50000,
						equity: null,
						companyHandle: "c2",
					},
				],
			},
		});
	});

	test("Unauthorized for not user or no admin", async function () {
		const resp = await request(app).get(`/users/u1`).set("authorization", `Bearer ${u3Token}`);
		expect(resp.statusCode).toEqual(403);
	});

	test("unauth for anon", async function () {
		const resp = await request(app).get(`/users/u1`);
		expect(resp.statusCode).toEqual(401);
	});

	test("not found if user not found", async function () {
		const resp = await request(app).get(`/users/nope`).set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(404);
	});
});

/************************************** PATCH /users/:username */

describe("PATCH /users/:username", () => {
	test("works for admin", async function () {
		const resp = await request(app)
			.patch(`/users/u1`)
			.send({
				firstName: "New",
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.body).toEqual({
			user: {
				username: "u1",
				firstName: "New",
				lastName: "U1L",
				email: "user1@user.com",
				isAdmin: false,
			},
		});
	});

	test("works for owners", async function () {
		const resp = await request(app)
			.patch(`/users/u1`)
			.send({
				firstName: "New",
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.body).toEqual({
			user: {
				username: "u1",
				firstName: "New",
				lastName: "U1L",
				email: "user1@user.com",
				isAdmin: false,
			},
		});
	});

	test("unauthorized for not owner or not admin", async function () {
		const resp = await request(app)
			.patch(`/users/u1`)
			.send({
				firstName: "New",
			})
			.set("authorization", `Bearer ${u3Token}`);
		expect(resp.statusCode).toEqual(403);
	});

	test("unauth for anon", async function () {
		const resp = await request(app).patch(`/users/u1`).send({
			firstName: "New",
		});
		expect(resp.statusCode).toEqual(401);
	});

	test("not found if no such user", async function () {
		const resp = await request(app)
			.patch(`/users/nope`)
			.send({
				firstName: "Nope",
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(404);
	});

	test("bad request if invalid data", async function () {
		const resp = await request(app)
			.patch(`/users/u1`)
			.send({
				firstName: 42,
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});

	test("works: set new password", async function () {
		const resp = await request(app)
			.patch(`/users/u1`)
			.send({
				password: "new-password",
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.body).toEqual({
			user: {
				username: "u1",
				firstName: "U1F",
				lastName: "U1L",
				email: "user1@user.com",
				isAdmin: false,
			},
		});
		const isSuccessful = await User.authenticate("u1", "new-password");
		expect(isSuccessful).toBeTruthy();
	});
});

/************************************** DELETE /users/:username */

describe("DELETE /users/:username", function () {
	test("works for admin", async function () {
		const resp = await request(app).delete(`/users/u1`).set("authorization", `Bearer ${adminToken}`);
		expect(resp.body).toEqual({ deleted: "u1" });
	});

	test("works for owner", async function () {
		const resp = await request(app).delete(`/users/u1`).set("authorization", `Bearer ${u1Token}`);
		expect(resp.body).toEqual({ deleted: "u1" });
	});

	test("unauthorized for not owner or not admin", async function () {
		const resp = await request(app).delete(`/users/u1`).set("authorization", `Bearer ${u3Token}`);
		expect(resp.statusCode).toEqual(403);
	});

	test("unauth for anon", async function () {
		const resp = await request(app).delete(`/users/u1`);
		expect(resp.statusCode).toEqual(401);
	});

	test("not found if user missing", async function () {
		const resp = await request(app).delete(`/users/nope`).set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(404);
	});
});

/************************************** POST /users/:username/jobs/:id */

describe("POST /users/:username/jobs/:id", function () {
	test("works for admin", async function () {
		const resp = await request(app)
			.post("/users/u1/jobs/1")
			.send({
				username: "u1",
				jobId: 1,
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			applied: "1",
		});
	});

	test("works for owner", async function () {
		const resp = await request(app)
			.post("/users/u1/jobs/1")
			.send({
				username: "u1",
				jobId: 1,
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			applied: "1",
		});
	});

	test("fails when job id does not exist", async function () {
		const resp = await request(app)
			.post("/users/u1/jobs/99")
			.send({
				username: "u1",
				jobId: 1,
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(400);
	});

	test("fails when user has already submitted application for job", async function () {
		await request(app)
			.post("/users/u1/jobs/99")
			.send({
				username: "u1",
				jobId: 1,
			})
			.set("authorization", `Bearer ${u1Token}`);
		const resp = await request(app)
			.post("/users/u1/jobs/99")
			.send({
				username: "u1",
				jobId: 1,
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(400);
	});
});
