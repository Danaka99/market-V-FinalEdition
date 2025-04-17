const mongoose = require("mongoose");

const imageUploadSchema = mongoose.Schema({
  images: {
    type: [
      {
        type: String,
        required: "Image URL is required",
      },
    ],
    validate: [
      {
        validator: function (arr) {
          return arr && arr.length > 0;
        },
        message: "At least one image is required",
      },
    ],
  },
});

imageUploadSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

imageUploadSchema.set("toJSON", {
  virtuals: true,
});

exports.ImageUpload = mongoose.model("ImageUpload", imageUploadSchema);
exports.imageUploadSchema = imageUploadSchema;
