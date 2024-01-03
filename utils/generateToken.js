const jwt = require("jsonwebtoken");

// create access token
const generateAccessToken = async (payload) => {
  let token = await jwt.sign(payload, process.env.JWT_ACCESS_TOKEN, {
    expiresIn: "1d",
  });
  return token;
};

// create refresh token
const generateRefreshToken = async (payload) => {
  let token = await jwt.sign(payload, process.env.JWT_REFRESH_TOKEN, {
    expiresIn: "30d",
  });
  return token;
};

// export module
module.exports = { generateAccessToken, generateRefreshToken };
