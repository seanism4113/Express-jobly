const { BadRequestError } = require("../expressError");

/**
 * function sqlForPartialUpdate Generates a SQL `SET` clause and values array for a partial update query.
 *
 * dataToUpdate - An object containing the fields and values to update.
 * Ex: { firstName: 'Aliya', age: 32 }
 *
 * jsToSql - An optional object mapping JavaScript field names to SQL column names.
 * Example: { firstName: "first_name", age: "age" }
 *
 * THe function returns:
 *   - `setCols`: A string for the SQL `SET` clause, e.g., `"first_name"=$1, "age"=$2`.
 *   - `values`: An array of values corresponding to each field in `dataToUpdate` for SQL param queries.
 *
 *   const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
 *   // result => {
 *   //   setCols: '"first_name"=$1, "age"=$2',
 *   //   values: ['Aliya', 32]
 *   // }
 **/

function sqlForPartialUpdate(dataToUpdate, jsToSql = {}) {
	const keys = Object.keys(dataToUpdate);
	if (keys.length === 0) throw new BadRequestError("No data");

	const cols = keys.map((colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`);

	return {
		setCols: cols.join(", "),
		values: Object.values(dataToUpdate),
	};
}

module.exports = { sqlForPartialUpdate };
