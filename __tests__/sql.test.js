const { sqlForPartialUpdate } = require("../helpers/sql");

describe("Test for sqlForPartialUpdate function", () => {
	test("Basic test with 2 fields mapped", () => {
		const testData = sqlForPartialUpdate({ firstName: "Aliya", age: 32 }, { firstName: "first_name", age: "age" });
		expect(testData).toEqual({
			setCols: '"first_name"=$1, "age"=$2',
			values: ["Aliya", 32],
		});
	});

	test("Test for error if dataToUpdate is empty", () => {
		expect(() => {
			sqlForPartialUpdate({}, { firstName: "first_name", age: "age" });
		}).toThrow("No data");
	});

	test("Test for jsToSql mapping is empty", () => {
		const testData = sqlForPartialUpdate({ firstName: "Aliya", age: 32 });
		expect(testData).toEqual({
			setCols: '"firstName"=$1, "age"=$2',
			values: ["Aliya", 32],
		});
	});

	test("Test with different fields", () => {
		const testData = sqlForPartialUpdate({ firstName: "Aliya", age: 32, email: "aliya@gmail.com" }, { firstName: "first_name", age: "age" });
		expect(testData).toEqual({
			setCols: '"first_name"=$1, "age"=$2, "email"=$3',
			values: ["Aliya", 32, "aliya@gmail.com"],
		});
	});
});
