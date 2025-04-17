const mongoose = require("mongoose");

const bannersSchema = mongoose.Schema({
  images: [
    {
      type: String,
      required: true,
    },
  ],
  catId: {
    type: String,
  },
  catName: {
    type: String,
  },
  subCatId: {
    type: String,
  },
  subCatName: {
    type: String,
  },
});

// Custom validator for non-empty images array
bannersSchema.path("images").validate(function (value) {
  return value && value.length > 0;
}, "At least one image is required");

bannersSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

bannersSchema.set("toJSON", {
  virtuals: true,
});

exports.Banner = mongoose.model("Banners", bannersSchema);
exports.bannersSchema = bannersSchema;
