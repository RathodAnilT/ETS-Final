const mongoose = require('mongoose');
require('dotenv').config();
const MONGODB_URL = process.env.MONGODB_LINK;

const connectDb = async () => {
    try {
        console.log("🔐 Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(`MongoDb server connected successfully at ${mongoose.connection.host}`);
    } catch (error) {
        console.log(`❌ MongoDb server not connected: ${error.message}`);
    }
};

module.exports = connectDb;
