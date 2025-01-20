const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  try {
    // Check if Authorization header is present
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).send({
        message: "Authorization header is missing",
        success: false,
      });
    }

    // Extract the token from the Authorization header
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).send({
        message: "Token is missing",
        success: false,
      });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).send({
          message: "Invalid or expired token",
          success: false,
        });
      }

      req.user = decoded; 
      req.body.userId = decoded.id;

      next(); 
    });
  } catch (error) {
    console.error("Error in authentication middleware:", error);

    return res.status(401).send({
      message: "Authentication failed",
      success: false,
    });
  }
};
