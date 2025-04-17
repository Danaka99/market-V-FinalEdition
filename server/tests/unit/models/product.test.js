const chai = require("chai");
const mongoose = require("mongoose");
const { Product } = require("../../../models/products");
const { Category } = require("../../../models/category");
require("dotenv").config({ path: "./.env.test" });
const expect = chai.expect;

describe("Product Model", () => {
  let category;

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
    category = new Category({
      name: "Test Category",
      icon: "test-icon",
      color: "#000000",
      slug: "test-category",
    });
    await category.save();
  });

  after(async () => {
    await Category.deleteMany({});
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Product.deleteMany({});
  });

  it("should create a valid product with required fields", async () => {
    const product = new Product({
      name: "Test Product",
      description: "Test Description",
      images: ["image1.jpg", "image2.jpg"],
      category: category._id,
      countInStock: 10,
      discount: 5,
    });

    const savedProduct = await product.save();
    expect(savedProduct._id).to.exist;
    expect(savedProduct.name).to.equal("Test Product");
    expect(savedProduct.images).to.have.lengthOf(2);
  });

  it("should fail validation without required fields", async () => {
    const product = new Product({});

    try {
      await product.validate();
      expect.fail("Validation should have failed");
    } catch (error) {
      expect(error.errors.name).to.exist;
      expect(error.errors.description).to.exist;
      expect(error.errors.category).to.exist;
      expect(error.errors.countInStock).to.exist;
      expect(error.errors.discount).to.exist;
    }
  });

  it("should set default values correctly", async () => {
    const product = new Product({
      name: "Test Product",
      description: "Description",
      images: ["image.jpg"],
      category: category._id,
      countInStock: 10,
      discount: 0,
    });

    expect(product.brand).to.equal("");
    expect(product.price).to.equal(0);
    expect(product.oldPrice).to.equal(0);
    expect(product.rating).to.equal(0);
    expect(product.isFeatured).to.be.false;
  });

  it("should handle array fields correctly", async () => {
    const product = new Product({
      name: "Test Product",
      description: "Description",
      images: ["image1.jpg", "image2.jpg"],
      category: category._id,
      countInStock: 10,
      discount: 0,
      productRam: ["4GB", "8GB"],
      size: ["S", "M", "L"],
      productWeight: ["500g", "1kg"],
      location: [
        { value: "loc1", label: "Location 1" },
        { value: "loc2", label: "Location 2" },
      ],
    });

    const savedProduct = await product.save();
    expect(savedProduct.productRam).to.have.lengthOf(2);
    expect(savedProduct.size).to.have.lengthOf(3);
    expect(savedProduct.location).to.have.lengthOf(2);
    expect(savedProduct.location[0].value).to.equal("loc1");
  });

  it("should generate virtual id field", async () => {
    const product = new Product({
      name: "Test Product",
      description: "Description",
      images: ["image.jpg"],
      category: category._id,
      countInStock: 10,
      discount: 0,
    });

    const savedProduct = await product.save();
    expect(savedProduct.id).to.be.a("string");
    expect(savedProduct.id).to.equal(savedProduct._id.toHexString());
  });

  it("should populate category reference", async () => {
    const product = new Product({
      name: "Test Product",
      description: "Description",
      images: ["image.jpg"],
      category: category._id,
      countInStock: 10,
      discount: 0,
    });

    await product.save();
    const populatedProduct = await Product.findById(product._id).populate(
      "category"
    );
    expect(populatedProduct.category).to.be.an("object");
    expect(populatedProduct.category.name).to.equal("Test Category");
  });
});
