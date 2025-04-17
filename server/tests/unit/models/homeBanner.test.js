const chai = require("chai");
const mongoose = require("mongoose");
const { HomeBanner } = require("../../../models/homeBanner");
require("dotenv").config({ path: "./.env.test" });
const expect = chai.expect;

describe("HomeBanner Model", () => {
  let homeBanner;

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(() => {
    homeBanner = new HomeBanner({
      images: ["image1.jpg", "image2.jpg"],
    });
  });

  afterEach(async () => {
    await HomeBanner.deleteMany({});
  });

  it("should create a valid HomeBanner with images", async () => {
    await homeBanner.validate();
    expect(homeBanner.images).to.have.lengthOf(2);
    expect(homeBanner.images).to.include("image1.jpg");
    expect(homeBanner.images).to.include("image2.jpg");
  });

  it("should be invalid if images array is empty", async () => {
    const invalidBanner = new HomeBanner({
      images: [],
    });

    try {
      await invalidBanner.validate();
      expect.fail("Validation should have failed");
    } catch (error) {
      expect(error.errors.images).to.exist;
    }
  });

  it("should generate virtual id field", () => {
    expect(homeBanner.id).to.be.a("string");
    expect(homeBanner.toJSON()).to.have.property("id");
  });
});
