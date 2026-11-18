const jwt = require("jsonwebtoken");

function verifyJWT(req, res, next) {
  if (process.env.DEV_BYPASS_AUTH === "true") {
    // TODO: Remove this development bypass before production.
    req.user = {
      email: req.headers["x-dev-email"] || "demo@studiospace.app",
      name: req.headers["x-dev-name"] || "Demo Host",
    };
    return next();
  }

  const token = req.cookies && req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!process.env.JWT_SECRET) {
    return next(new Error("JWT_SECRET is not configured"));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    return next(error);
  }

  if (
    !decoded ||
    typeof decoded !== "object" ||
    typeof decoded.email !== "string" ||
    typeof decoded.name !== "string"
  ) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  req.user = { email: decoded.email, name: decoded.name };
  return next();
}

module.exports = verifyJWT;