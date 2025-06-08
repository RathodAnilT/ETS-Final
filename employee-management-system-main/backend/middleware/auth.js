// Re-export the authentication middleware with additional logging
const authMiddleware = require('./check-auth');

// Log each time this middleware is imported/required
console.log("Auth middleware loaded with correct configuration");

module.exports = authMiddleware; 
 
 