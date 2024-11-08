"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
	/** Create a job (from data), update db, return new job data.
	 *
	 * data should be { title, salary, equity, company_handle }
	 *
	 * Returns { id, title, salary, equity, company_handle }
	 *
	 * Throws BadRequestError if job title for company already in database.
	 * */

	static async create({ title, salary, equity, companyHandle }) {
		const duplicateCheck = await db.query(
			`SELECT title
           FROM jobs
           WHERE title = $1 AND company_handle = $2`,
			[title, companyHandle]
		);

		if (duplicateCheck.rows[0]) throw new BadRequestError(`Duplicate job title: ${title} for company: ${companyHandle}`);

		const result = await db.query(
			`INSERT INTO jobs
           (title, salary, equity, company_handle )
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle as "companyHandle"`,
			[title, salary, equity, companyHandle]
		);
		const job = result.rows[0];

		return job;
	}

	/** Find all jobs.
	 *
	 * Returns [{ id, title, salary, equity, company_handle  }, ...]
	 * */

	static async findAll(queries = {}) {
		let queryValues = [];
		let queryFilters = [];
		// Destructure with defaults for queries
		const { title = "", minSalary = null, hasEquity } = queries;
		const hasEquityBoolean = hasEquity === "true";

		// If title exist in the query, then build filter
		if (title) {
			const words = title.split(" ");
			for (let word of words) {
				queryFilters.push(`title ILIKE $${queryValues.length + 1}`);
				queryValues.push(`%${word}%`);
			}
		}

		// If minSalary exist in the query, then build filter
		if (minSalary !== null) {
			queryFilters.push(`salary >= $${queryValues.length + 1} `);
			queryValues.push(Number(minSalary));
		}

		// If hasEquity exist in the query, then build filter
		if (hasEquityBoolean) {
			queryFilters.push(`equity > $${queryValues.length + 1} AND equity IS NOT NULL`);
			queryValues.push(0);
		}

		// Join all filters with AND for the WHERE clause if filters exist
		const whereClause = queryFilters.length > 0 ? `WHERE ${queryFilters.join(" AND ")}` : "";

		const jobsRes = await db.query(
			`SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
		   ${whereClause}
           ORDER BY title`,
			queryValues
		);

		return jobsRes.rows;
	}

	/** Given a id, return data about a job.
	 *
	 *   Returns { id, title, salary, equity, company_handle  }
	 *   where jobs id = jobId
	 *
	 * Throws NotFoundError if not found.
	 **/

	static async get(jobId) {
		const jobRes = await db.query(
			`SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
			[jobId]
		);

		const job = jobRes.rows[0];

		if (!job) throw new NotFoundError(`No job with id: ${jobId}`);

		return job;
	}

	/** Update job data with `data`.
	 *
	 * This is a "partial update" --- it's fine if data doesn't contain all the
	 * fields; this only changes provided ones.
	 *
	 * Data can include: {title, salary, and equity}
	 *
	 * Returns {id, title, salary, equity, company_handle }
	 *
	 * Throws NotFoundError if not found.
	 */

	static async update(jobId, data) {
		if ("id" in data || "company_handle" in data) {
			throw new BadRequestError("Updating id or company_handle is not allowed");
		}

		const { setCols, values } = sqlForPartialUpdate(data);
		const jobIdVarIdx = "$" + (values.length + 1);

		const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${jobIdVarIdx} 
                      RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;

		const result = await db.query(querySql, [...values, jobId]);
		const job = result.rows[0];

		if (!job) throw new NotFoundError(`No job with id: ${jobId}`);

		return job;
	}

	/** Delete given job from database; returns undefined.
	 *
	 * Throws NotFoundError if job not found.
	 **/

	static async remove(jobId) {
		const result = await db.query(
			`DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
			[jobId]
		);
		const job = result.rows[0];

		if (!job) throw new NotFoundError(`No job with id: ${jobId}`);

		return { deleted: jobId };
	}
}

module.exports = Job;
