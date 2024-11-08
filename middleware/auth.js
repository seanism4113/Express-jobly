"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError, ForbiddenError } = require("../expressError");

/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
	try {
		const authHeader = req.headers && req.headers.authorization;
		if (authHeader) {
			const token = authHeader.replace(/^[Bb]earer /, "").trim();
			res.locals.user = jwt.verify(token, SECRET_KEY);
		}
		return next();
	} catch (err) {
		return next();
	}
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
	try {
		if (!res.locals.user) throw new UnauthorizedError();
		return next();
	} catch (err) {
		return next(err);
	}
}

/** Middleware to authenticate an admin
 *
 * If not, raises Unauthorized.
 */

function ensureAdmin(req, res, next) {
	try {
		if (res.locals.user && res.locals.user.isAdmin) {
			return next();
		} else if (res.locals.user) {
			throw new ForbiddenError("User must be admin");
		} else {
			throw new UnauthorizedError("No token provided or invalid token");
		}
	} catch (err) {
		return next(err);
	}
}

// Middleware to ensure only the user or an admin can access/modify their data

function ensureOwnerOrAdmin(req, res, next) {
	try {
		const loggedInUser = res.locals.user;
		const userIdFromParams = req.params.username;
		if (loggedInUser.isAdmin || loggedInUser.username === userIdFromParams) {
			return next();
		} else {
			throw new ForbiddenError("You do not have permission to access this resource");
		}
	} catch (err) {
		return next(err);
	}
}

module.exports = {
	authenticateJWT,
	ensureLoggedIn,
	ensureAdmin,
	ensureOwnerOrAdmin,
};
