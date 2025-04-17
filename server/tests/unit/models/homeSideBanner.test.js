const chai = require("chai");
const mongoose = require("mongoose");
const { HomeSideBanners } = require("../../../models/homeSideBanner");
require("dotenv").config({ path: "./.env.test" });

const expect = chai.expect;

describe("HomeSideBanners Model", () => {
  let homeSideBanner;

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(() => {
    homeSideBanner = new HomeSideBanners({
      images: ["image1.jpg", "image2.jpg"],
      catId: "123",
      catName: "Electronics",
      subCatId: "456",
      subCatName: "Laptops",
    });
  });

  afterEach(async () => {
    await HomeSideBanners.deleteMany({});
  });

  it("should create a valid HomeSideBanner with all fields", () => {
    expect(homeSideBanner).to.have.property("images").with.lengthOf(2);
    expect(homeSideBanner.images).to.include("image1.jpg");
    expect(homeSideBanner.images).to.include("image2.jpg");
    expect(homeSideBanner.catId).to.equal("123");
    expect(homeSideBanner.catName).to.equal("Electronics");
    expect(homeSideBanner.subCatId).to.equal("456");
    expect(homeSideBanner.subCatName).to.equal("Laptops");
  });

  it("should be invalid if images array is empty", async () => {
    const invalidHomeSideBanner = new HomeSideBanners({
      images: [],
      catId: "123",
      catName: "Electronics",
    });

    try {
      await invalidHomeSideBanner.validate();
      expect.fail("Validation should have failed");
    } catch (error) {
      expect(error).to.exist;
      expect(error.errors.images).to.exist;
      expect(error.errors.images.message).to.equal(
        "At least one image is required"
      );
    }
  });

  it("should allow missing optional fields (catId, catName, subCatId, subCatName)", async () => {
    const bannerWithoutOptionalFields = new HomeSideBanners({
      images: ["image.jpg"],
    });

    try {
      await bannerWithoutOptionalFields.validate();
    } catch (err) {
      expect.fail(
        "Validation should not have failed when optional fields are missing"
      );
    }
  });

  it("should generate virtual id field", () => {
    expect(homeSideBanner).to.have.property("id");
    expect(homeSideBanner.id).to.be.a("string");
    expect(homeSideBanner.toJSON()).to.have.property("id");
  });

  it("should convert to JSON with virtuals", () => {
    const jsonBanner = homeSideBanner.toJSON();
    expect(jsonBanner).to.have.property("id");
    expect(jsonBanner).to.have.property("images");
    expect(jsonBanner).to.have.property("catId");
    expect(jsonBanner).to.have.property("catName");
    expect(jsonBanner).to.have.property("subCatId");
    expect(jsonBanner).to.have.property("subCatName");
  });
});
