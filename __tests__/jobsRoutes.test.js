"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll, u1Token, adminToken } = require("../testHelpers/_testRoutesCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
	const newJob = {
		title: "New title",
		salary: 75000,
		equity: 0.789,
		companyHandle: "c1",
	};

	test("ok for admin", async function () {
		const resp = await request(app).post("/jobs").send(newJob).set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			job: {
				id: expect.any(Number),
				title: "New title",
				salary: 75000,
				equity: "0.789",
				companyHandle: "c1",
			},
		});
	});

	test("unauthorized for not admin", async function () {
		const resp = await request(app).post("/jobs").send(newJob).set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(403);
	});

	test("bad request with missing data", async function () {
		const resp = await request(app)
			.post("/jobs")
			.send({
				title: "New title",
				salary: 75000,
				equity: "0.789",
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});

	test("bad request with invalid data", async function () {
		const resp = await request(app)
			.post("/jobs")
			.send({
				...newJob,
				salary: "Not a Number",
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
	test("ok for anon", async function () {
		const resp = await request(app).get("/jobs");
		expect(resp.body).toEqual({
			jobs: [
				{
					id: 1,
					title: "j1",
					salary: 10000,
					equity: null,
					companyHandle: "c1",
				},
				{
					id: 2,
					title: "j2",
					salary: 50000,
					equity: null,
					companyHandle: "c2",
				},
				{
					id: 3,
					title: "j3",
					salary: 100000,
					equity: "0.123",
					companyHandle: "c1",
				},
			],
		});
	});

	test("filter by title", async function () {
		const resp = await request(app).get("/jobs?title=j1");
		expect(resp.body).toEqual({
			jobs: [
				{
					id: 1,
					title: "j1",
					salary: 10000,
					equity: null,
					companyHandle: "c1",
				},
			],
		});
	});

	test("filter by minSalary", async function () {
		const resp = await request(app).get("/jobs?minSalary=40000");
		expect(resp.body).toEqual({
			jobs: [
				{
					id: 2,
					title: "j2",
					salary: 50000,
					equity: null,
					companyHandle: "c2",
				},
				{
					id: 3,
					title: "j3",
					salary: 100000,
					equity: "0.123",
					companyHandle: "c1",
				},
			],
		});
	});

	test("filter by hasEquity", async function () {
		const resp = await request(app).get("/jobs?hasEquity=true");
		expect(resp.body).toEqual({
			jobs: [
				{
					id: 3,
					title: "j3",
					salary: 100000,
					equity: "0.123",
					companyHandle: "c1",
				},
			],
		});
	});

	test("fails: test next() handler", async function () {
		// there's no normal failure event which will cause this route to fail ---
		// thus making it hard to test that the error-handler works with it. This
		// should cause an error, all right :)
		await db.query("DROP TABLE jobs CASCADE");
		const resp = await request(app).get("/jobs").set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(500);
	});
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
	test("works for anon", async function () {
		const resp = await request(app).get(`/jobs/1`);
		expect(resp.body).toEqual({
			job: {
				id: 1,
				title: "j1",
				salary: 10000,
				equity: null,
				companyHandle: "c1",
			},
		});
	});

	test("not found for no such job", async function () {
		const resp = await request(app).get(`/jobs/99`);
		expect(resp.statusCode).toEqual(404);
	});
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
	test("works for admin", async function () {
		const resp = await request(app)
			.patch(`/jobs/1`)
			.send({
				title: "update",
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.body).toEqual({
			job: {
				id: 1,
				title: "update",
				salary: 10000,
				equity: null,
				companyHandle: "c1",
			},
		});
	});

	test("unauthorized for not admin", async function () {
		const resp = await request(app)
			.patch(`/jobs/1`)
			.send({
				title: "update",
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(403);
	});

	test("unauth for anon", async function () {
		const resp = await request(app).patch(`/jobs/1`).send({
			title: "update",
		});
		expect(resp.statusCode).toEqual(401);
	});

	test("not found on no such job", async function () {
		const resp = await request(app)
			.patch(`/jobs/99`)
			.send({
				title: "update",
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(404);
	});

	test("bad request on id change attempt", async function () {
		const resp = await request(app)
			.patch(`/jobs/1`)
			.send({
				id: "5",
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});

	test("bad request on comp_handle change attempt", async function () {
		const resp = await request(app)
			.patch(`/jobs/1`)
			.send({
				companyHandle: "c3",
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});

	test("bad request on invalid data", async function () {
		const resp = await request(app)
			.patch(`/jobs/1`)
			.send({
				salary: "10000",
			})
			.set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
	test("works for admin", async function () {
		const resp = await request(app).delete(`/jobs/1`).set("authorization", `Bearer ${adminToken}`);
		expect(resp.body).toEqual({ deleted: "1" });
	});

	test("unauthorized for not admin", async function () {
		const resp = await request(app).delete(`/jobs/1`).set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(403);
	});

	test("unauth for anon", async function () {
		const resp = await request(app).delete(`/jobs/1`);
		expect(resp.statusCode).toEqual(401);
	});

	test("not found for no such job", async function () {
		const resp = await request(app).delete(`/jobs/99`).set("authorization", `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(404);
	});
});
