const chai = require("chai");
const mongoose = require("mongoose");
const { HomeBottomBanners } = require("../../../models/homeBottomBanner");
require("dotenv").config({ path: "./.env.test" });
const expect = chai.expect;

describe("HomeBottomBanners Model", () => {
  let homeBottomBanner;

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(() => {
    homeBottomBanner = new HomeBottomBanners({
      images: ["image1.jpg", "image2.jpg"],
      catId: "123",
      catName: "Electronics",
      subCatId: "456",
      subCatName: "Laptops",
    });
  });

  afterEach(async () => {
    await HomeBottomBanners.deleteMany({});
  });

  it("should create a valid HomeBottomBanner with all fields", async () => {
    await homeBottomBanner.validate();
    expect(homeBottomBanner.images).to.have.lengthOf(2);
    expect(homeBottomBanner.catId).to.equal("123");
    expect(homeBottomBanner.catName).to.equal("Electronics");
    expect(homeBottomBanner.subCatId).to.equal("456");
    expect(homeBottomBanner.subCatName).to.equal("Laptops");
  });

  it("should be invalid if images array is empty", async () => {
    const invalidBanner = new HomeBottomBanners({
      images: [],
      catId: "123",
    });

    try {
      await invalidBanner.validate();
      expect.fail("Validation should have failed");
    } catch (error) {
      expect(error.errors.images).to.exist;
      expect(error.errors.images.message).to.equal(
        "At least one image is required"
      );
    }
  });

  it("should allow missing optional fields", async () => {
    const minimalBanner = new HomeBottomBanners({
      images: ["image.jpg"],
    });
    await minimalBanner.validate();
  });

  it("should generate virtual id field", () => {
    expect(homeBottomBanner.id).to.be.a("string");
    expect(homeBottomBanner.toJSON()).to.have.property("id");
  });
});
