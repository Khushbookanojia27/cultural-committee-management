const jwt = require("jsonwebtoken");

const getJwtSecret = () => {
  // The development fallback keeps local setup usable. Production deployments
  // should always set JWT_SECRET in their environment.
  return process.env.JWT_SECRET || "cultural-committee-development-secret";
};

const createToken = (user) =>
  jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn: "7d" }
  );

module.exports = {
  createToken,
  getJwtSecret,
};
