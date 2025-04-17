const cloudinary = require("cloudinary").v2;

if (process.env.NODE_ENV === "test") {
  require("dotenv").config({ path: "./.env.test" });
}

cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});

module.exports = cloudinary;
