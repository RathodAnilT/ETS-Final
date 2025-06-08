const jwt = require("jsonwebtoken");

// Use the exact same secret key as in userController.js
const secretKey = "6e97deb2f832bbaa0ceadcbd8f94abb053da76fe4f695392bf0012c646921ca3";

module.exports = (req, res, next) => {
  console.log("Checking authentication...");
  try {
    const authHeader = req.headers.authorization;
    console.log("Authorization header:", authHeader ? `${authHeader.substring(0, 15)}...` : 'missing');
    
    if (!authHeader) {
      console.error("No Authorization header found");
      return res.status(401).json({
        message: "No authorization header found",
        success: false,
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.error("No token found in Authorization header");
      return res.status(401).json({
        message: "No token found in Authorization header",
        success: false,
      });
    }

    try {
      // Log the token and secret for debugging
      console.log("Token to verify:", token.substring(0, 20) + "...");
      
      // Use the exact same secret key as in userController
      const decodedToken = jwt.verify(token, secretKey);
      console.log("Token verified successfully. User ID:", decodedToken.userId);
      
      // Set both req.userData and req.user for backward compatibility
      req.userData = {
        userId: decodedToken.userId,
        isSuperUser: decodedToken.isSuperUser,
      };
      
      // Set req.user to match what the controller expects
      req.user = {
        id: decodedToken.userId,
        isSuperUser: decodedToken.isSuperUser,
      };
      
      next();
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError.message);
      return res.status(401).json({
        message: "Token verification failed: " + jwtError.message,
        success: false,
      });
    }
  } catch (error) {
    console.error("Authentication check failed:", error.message);
    return res.status(401).json({
      message: "Authentication failed",
      success: false,
    });
  }
};
