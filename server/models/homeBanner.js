const mongoose = require("mongoose");

const homeBannerSchema = mongoose.Schema({
  images: {
    type: [String],
    required: true,
    validate: {
      validator: function (v) {
        return v && v.length > 0;
      },
      message: "At least one image is required",
    },
  },
});

homeBannerSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

homeBannerSchema.set("toJSON", {
  virtuals: true,
});

exports.HomeBanner = mongoose.model("HomeBanner", homeBannerSchema);
exports.homeBannerSchema = homeBannerSchema;
