"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError.js");
const Job = require("../models/job.js");
const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll } = require("../testHelpers/_testModelsCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
	const newJob = {
		title: "New title",
		salary: 75000,
		equity: null,
		companyHandle: "c1",
	};

	test("works", async function () {
		let job = await Job.create(newJob);

		const expectedJob = {
			title: "New title",
			salary: 75000,
			equity: null,
			companyHandle: "c1",
		};

		const result = await db.query(
			`SELECT id, title, salary, equity, company_handle as "companyHandle"
           FROM jobs
           WHERE id = $1`,
			[job.id]
		);
		expect(result.rows).toEqual([
			{
				id: 4,
				title: "New title",
				salary: 75000,
				equity: null,
				companyHandle: "c1",
			},
		]);
	});

	test("bad request with dupe", async function () {
		try {
			await Job.create(newJob);
			await Job.create(newJob);
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

/************************************** findAll */

describe("findAll", function () {
	test("works: no filter", async function () {
		let jobs = await Job.findAll();
		expect(jobs).toEqual([
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
		]);
	});

	test("works: filter by title", async function () {
		let jobs = await Job.findAll({ title: "j1" });
		expect(jobs).toEqual([
			{
				id: 1,
				title: "j1",
				salary: 10000,
				equity: null,
				companyHandle: "c1",
			},
		]);
	});

	test("works: filter by minSalary", async function () {
		let jobs = await Job.findAll({ minSalary: 40000 });
		expect(jobs).toEqual([
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
		]);
	});

	test("works: filter by hasEquity", async function () {
		let jobs = await Job.findAll({ hasEquity: "true" });
		expect(jobs).toEqual([
			{
				id: 3,
				title: "j3",
				salary: 100000,
				equity: "0.123",
				companyHandle: "c1",
			},
		]);
	});
});

/************************************** get */

describe("get", function () {
	test("works", async function () {
		let job = await Job.get("1");
		expect(job).toEqual({
			id: 1,
			title: "j1",
			salary: 10000,
			equity: null,
			companyHandle: "c1",
		});
	});

	test("not found if no such job", async function () {
		try {
			await Job.get("99");
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

/************************************** update */

describe("update", function () {
	const updateData = {
		title: "New",
		salary: 99999,
		equity: "0.321",
	};

	test("works", async function () {
		let job = await Job.update(1, updateData);
		expect(job).toEqual({
			id: 1,
			...updateData,
			companyHandle: "c1",
		});

		const result = await db.query(
			`SELECT id, title, salary, equity, company_handle as "companyHandle"
	           FROM jobs
	           WHERE id = 1`
		);
		expect(result.rows).toEqual([
			{
				id: 1,
				title: "New",
				salary: 99999,
				equity: "0.321",
				companyHandle: "c1",
			},
		]);
	});

	test("works: null fields", async function () {
		const updateDataSetNulls = {
			salary: null,
			equity: null,
		};

		let job = await Job.update(3, updateDataSetNulls);
		expect(job).toEqual({
			id: 3,
			title: "j3",
			...updateDataSetNulls,
			companyHandle: "c1",
		});

		const result = await db.query(
			`SELECT id, title, salary, equity, company_handle as "companyHandle"
	           FROM jobs
	           WHERE id = 3`
		);
		expect(result.rows).toEqual([
			{
				id: 3,
				title: "j3",
				salary: null,
				equity: null,
				companyHandle: "c1",
			},
		]);
	});

	test("not found if no such job", async function () {
		try {
			await Job.update(99, updateData);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});

	test("bad request with no data", async function () {
		try {
			await Job.update(1, {});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

/************************************** remove */

describe("remove", function () {
	test("works", async function () {
		await Job.remove(1);
		const res = await db.query("SELECT id FROM jobs WHERE id=1");
		expect(res.rows.length).toEqual(0);
	});

	test("not found if no such job", async function () {
		try {
			await Job.remove("99");
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});
