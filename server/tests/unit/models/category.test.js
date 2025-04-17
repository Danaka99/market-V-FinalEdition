const chai = require("chai");
const mongoose = require("mongoose");
const { Category } = require("../../../models/category");
require("dotenv").config({ path: "./.env.test" });

const expect = chai.expect;

describe("Category Model", () => {
  let category;

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(() => {
    category = new Category({
      name: "Electronics",
      slug: "electronics",
      images: ["image1.jpg", "image2.jpg"],
      color: "Red",
      parentId: "12345",
    });
  });

  afterEach(async () => {
    await Category.deleteMany({});
  });

  it("should create a valid category with all fields", () => {
    expect(category).to.have.property("name").that.equals("Electronics");
    expect(category).to.have.property("slug").that.equals("electronics");
    expect(category).to.have.property("images").with.lengthOf(2);
    expect(category.images).to.include("image1.jpg");
    expect(category.images).to.include("image2.jpg");
    expect(category).to.have.property("color").that.equals("Red");
    expect(category).to.have.property("parentId").that.equals("12345");
  });

  it("should be invalid if name or slug is missing", async () => {
    const invalidCategory = new Category({
      slug: "electronics",
    });

    try {
      await invalidCategory.validate();
      expect.fail("Validation should have failed without name");
    } catch (err) {
      expect(err).to.exist;
      expect(err.errors).to.have.property("name");
    }

    const invalidCategory2 = new Category({
      name: "Electronics",
    });

    try {
      await invalidCategory2.validate();
      expect.fail("Validation should have failed without slug");
    } catch (err) {
      expect(err).to.exist;
      expect(err.errors).to.have.property("slug");
    }
  });

  it("should be invalid if slug is not unique", async () => {
    await category.save();
    const duplicateCategory = new Category({
      name: "Home Appliances",
      slug: "electronics",
    });

    try {
      await duplicateCategory.save();
      expect.fail("Save should have failed because of duplicate slug");
    } catch (err) {
      expect(err).to.exist;
      expect(err.code).to.equal(11000);
    }
  });

  it("should allow missing optional fields (images, color, parentId)", async () => {
    const categoryWithoutOptionalFields = new Category({
      name: "Furniture",
      slug: "furniture",
    });

    try {
      await categoryWithoutOptionalFields.validate();
    } catch (err) {
      expect.fail(
        "Validation should not have failed when optional fields are missing"
      );
    }
  });

  it("should generate virtual id field", () => {
    expect(category).to.have.property("id");
    expect(category.id).to.be.a("string");
    expect(category.toJSON()).to.have.property("id");
  });

  it("should convert to JSON with virtuals", () => {
    const jsonCategory = category.toJSON();
    expect(jsonCategory).to.have.property("id");
    expect(jsonCategory).to.have.property("name");
    expect(jsonCategory).to.have.property("slug");
    expect(jsonCategory).to.have.property("images");
    expect(jsonCategory).to.have.property("color");
    expect(jsonCategory).to.have.property("parentId");
  });
});
