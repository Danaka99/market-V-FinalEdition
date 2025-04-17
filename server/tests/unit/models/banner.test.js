const chai = require("chai");
const mongoose = require("mongoose");
const { Banner } = require("../../../models/banners");
require("dotenv").config({ path: "./.env.test" });

const expect = chai.expect;

describe("Banner Model", () => {
  let banner;

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(() => {
    banner = new Banner({
      images: ["image1.jpg", "image2.jpg"],
      catId: "123",
      catName: "Electronics",
      subCatId: "456",
      subCatName: "Laptops",
    });
  });

  afterEach(async () => {
    await Banner.deleteMany({});
  });

  it("should create a valid banner with all fields", () => {
    expect(banner).to.have.property("images").with.lengthOf(2);
    expect(banner.images).to.include("image1.jpg");
    expect(banner.images).to.include("image2.jpg");
    expect(banner.catId).to.equal("123");
    expect(banner.catName).to.equal("Electronics");
    expect(banner.subCatId).to.equal("456");
    expect(banner.subCatName).to.equal("Laptops");
  });

  it("should be invalid if images array is empty", async () => {
    const invalidBanner = new Banner({
      images: [],
      catId: "123",
      catName: "Electronics",
    });

    try {
      await invalidBanner.validate();
      expect.fail("Validation should have failed");
    } catch (err) {
      expect(err).to.exist;
      expect(err.errors).to.have.property("images");
      expect(err.errors.images.message).to.equal(
        "At least one image is required"
      );
    }
  });

  it("should generate virtual id field", () => {
    expect(banner).to.have.property("id");
    expect(banner.id).to.be.a("string");
    expect(banner.toJSON()).to.have.property("id");
  });

  it("should allow optional category fields", () => {
    const bannerWithoutCat = new Banner({
      images: ["image.jpg"],
    });
    const validationError = bannerWithoutCat.validateSync();
    expect(validationError).to.be.undefined;
  });

  it("should convert to JSON with virtuals", () => {
    const jsonBanner = banner.toJSON();
    expect(jsonBanner).to.have.property("id");
    expect(jsonBanner).to.have.property("images");
    expect(jsonBanner).to.have.property("catId");
    expect(jsonBanner).to.have.property("catName");
    expect(jsonBanner).to.have.property("subCatId");
    expect(jsonBanner).to.have.property("subCatName");
  });

  it("should require at least one image", async () => {
    const bannerWithoutImages = new Banner({
      catId: "123",
      catName: "Electronics",
    });

    try {
      await bannerWithoutImages.validate();
      expect.fail("Validation should have failed");
    } catch (err) {
      expect(err).to.exist;
      expect(err.errors).to.have.property("images");
      expect(err.errors.images.message).to.equal(
        "At least one image is required"
      );
    }
  });
});
