const chai = require("chai");
const mongoose = require("mongoose");
const { RecentlyViewd } = require("../../../models/recentlyViewd");
require("dotenv").config({ path: "./.env.test" });
const expect = chai.expect;

describe("RecentlyViewd Model", () => {
  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await RecentlyViewd.deleteMany({});
  });

  it("should create a valid recently viewed product", async () => {
    const product = new RecentlyViewd({
      name: "Sample Product",
      description: "This is a sample description",
      images: ["image1.jpg", "image2.jpg"],
      category: new mongoose.Types.ObjectId(),
      countInStock: 10,
      discount: 20,
    });

    const savedProduct = await product.save();
    expect(savedProduct._id).to.exist;
    expect(savedProduct.name).to.equal("Sample Product");
    expect(savedProduct.description).to.equal("This is a sample description");
    expect(savedProduct.images.length).to.equal(2);
    expect(savedProduct.countInStock).to.equal(10);
    expect(savedProduct.discount).to.equal(20);
  });

  it("should fail validation without required fields", async () => {
    const product = new RecentlyViewd({});

    try {
      await product.save();
      expect.fail("Validation should have failed, required fields missing");
    } catch (error) {
      expect(error.errors.name).to.exist;
      expect(error.errors.description).to.exist;
      expect(error.errors.category).to.exist;
      expect(error.errors.countInStock).to.exist;
      expect(error.errors.discount).to.exist;
    }
  });

  it("should set default values correctly", async () => {
    const product = new RecentlyViewd({
      name: "Test Product",
      description: "Test description",
      images: ["test1.jpg", "test2.jpg"],
      category: new mongoose.Types.ObjectId(),
      countInStock: 5,
      discount: 15,
    });

    const savedProduct = await product.save();

    expect(savedProduct.prodId).to.equal("");
    expect(savedProduct.brand).to.equal("");
    expect(savedProduct.oldPrice).to.equal(0);
    expect(savedProduct.catName).to.equal("");
    expect(savedProduct.subCatId).to.equal("");
    expect(savedProduct.subCat).to.equal("");
    expect(savedProduct.rating).to.equal(0);
    expect(savedProduct.isFeatured).to.equal(false);
  });

  it("should generate virtual id field", async () => {
    const product = new RecentlyViewd({
      name: "Virtual ID Test Product",
      description: "Test description",
      images: ["test1.jpg", "test2.jpg"],
      category: new mongoose.Types.ObjectId(),
      countInStock: 10,
      discount: 25,
    });

    const savedProduct = await product.save();
    expect(savedProduct.id).to.be.a("string");
    expect(savedProduct.id).to.equal(savedProduct._id.toHexString());
  });

  it("should handle empty fields correctly", async () => {
    const product = new RecentlyViewd({
      name: "Empty Fields Product",
      description: "Product with some empty fields",
      images: ["image.jpg"],
      category: new mongoose.Types.ObjectId(),
      countInStock: 3,
      discount: 10,
    });

    const savedProduct = await product.save();
    expect(savedProduct.prodId).to.equal("");
    expect(savedProduct.brand).to.equal("");
    expect(savedProduct.oldPrice).to.equal(0);
    expect(savedProduct.catName).to.equal("");
    expect(savedProduct.subCatId).to.equal("");
    expect(savedProduct.subCat).to.equal("");
    expect(savedProduct.rating).to.equal(0);
    expect(savedProduct.isFeatured).to.equal(false);
  });
});
