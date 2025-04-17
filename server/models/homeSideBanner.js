const mongoose = require("mongoose");

const homeSideBannersSchema = mongoose.Schema({
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

homeSideBannersSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

homeSideBannersSchema.set("toJSON", {
  virtuals: true,
});

exports.HomeSideBanners = mongoose.model(
  "HomeSideBanners",
  homeSideBannersSchema
);
exports.homeSideBannersSchema = homeSideBannersSchema;
