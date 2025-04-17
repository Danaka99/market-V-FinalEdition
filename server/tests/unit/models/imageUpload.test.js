const chai = require("chai");
const mongoose = require("mongoose");
const { ImageUpload } = require("../../../models/imageUpload");
require("dotenv").config({ path: "./.env.test" });
const expect = chai.expect;

describe("ImageUpload Model", () => {
  let imageUpload;

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(() => {
    imageUpload = new ImageUpload({
      images: ["test1.jpg", "test2.jpg"],
    });
  });

  afterEach(async () => {
    await ImageUpload.deleteMany({});
  });

  it("should create a valid ImageUpload with images", async () => {
    await imageUpload.validate();
    expect(imageUpload.images).to.have.lengthOf(2);
    expect(imageUpload.images).to.include("test1.jpg");
    expect(imageUpload.images).to.include("test2.jpg");
  });

  it("should be invalid if images array is empty", async () => {
    const invalidUpload = new ImageUpload({
      images: [],
    });

    try {
      await invalidUpload.validate();
      expect.fail("Validation should have failed");
    } catch (error) {
      expect(error.errors.images).to.exist;
    }
  });

  it("should generate virtual id field", () => {
    expect(imageUpload).to.have.property("id");
    expect(imageUpload.id).to.be.a("string");
    expect(imageUpload.toJSON()).to.have.property("id");
  });
});
