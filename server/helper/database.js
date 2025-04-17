const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.CONNECTION_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected"); // Matches the test expectation
  } catch (error) {
    console.error(error.message); // Matches the test expectation
    process.exit(1);
  }
};

module.exports = connectDB;
