const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai");
const { Product } = require("../../models/products");
const { Category } = require("../../models/category");
const express = require("express");
const productRoutes = require("../../routes/products");

require("dotenv").config({ path: "./.env.test" });

const app = express();
app.use(express.json());
app.use("/api/products", productRoutes);

describe("Product API Performance Tests", function () {
  this.timeout(80000);

  const CONFIG = {
    NUM_PRODUCTS: 50,
    BATCH_SIZE: 10,
    ACCEPTABLE_RESPONSE_TIME: 2500,
  };

  let testCategory;

  const createTestProduct = (index) => ({
    name: `Test Product ${index}`,
    description: `Test Description ${index}`,
    images: ["test-image.jpg"],
    category: testCategory._id,
    countInStock: 100,
    discount: 10,
    price: 99.99,
    brand: "Test Brand",
    oldPrice: 129.99,
    rating: 4.5,
    isFeatured: false,
    richDescription: "Rich description text",
    productRam: ["4GB", "8GB"],
    size: ["S", "M", "L"],
  });

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
    testCategory = await Category.create({
      name: "Test Category",
      icon: "test-icon",
      color: "#000000",
      slug: "test-category",
    });
  });

  after(async () => {
    await Category.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Product.deleteMany({});
  });

  it("should handle bulk product creation efficiently", async () => {
    const products = Array(CONFIG.NUM_PRODUCTS)
      .fill()
      .map((_, i) => ({
        name: `Test Product ${i}`,
        description: `Description for product ${i}`,
        images: ["test-image.jpg"],
        brand: "Test Brand",
        price: 100 + i,
        oldPrice: 150 + i,
        catId: testCategory.catId,
        catName: testCategory.name,
        subCat: "Test SubCat",
        subCatId: "sub123",
        category: testCategory._id,
        countInStock: 10,
        rating: 4.5,
        isFeatured: i % 2 === 0,
        discount: 10,
        location: [{ value: "NY", label: "New York" }],
      }));

    const startTime = Date.now();

    for (let i = 0; i < products.length; i += CONFIG.BATCH_SIZE) {
      const batch = products.slice(i, i + CONFIG.BATCH_SIZE);
      const promises = batch.map((product) =>
        request(app).post("/api/products/create").send(product)
      );
      const results = await Promise.all(promises);
      results.forEach((res) => expect(res.status).to.equal(201));
    }

    const totalTime = Date.now() - startTime;
    console.log(`Concurrent retrieval time: ${totalTime}ms`);
    expect(totalTime).to.be.below(
      CONFIG.ACCEPTABLE_RESPONSE_TIME *
        (CONFIG.NUM_PRODUCTS / CONFIG.BATCH_SIZE)
    );
  });

  it("should handle concurrent product retrievals efficiently", async () => {
    const products = Array(CONFIG.BATCH_SIZE)
      .fill()
      .map((_, i) => createTestProduct(i));

    await Product.insertMany(products);

    const startTime = Date.now();
    const getRequests = Array(CONFIG.BATCH_SIZE)
      .fill()
      .map(() => request(app).get("/api/products"));

    const results = await Promise.all(getRequests);
    const totalTime = Date.now() - startTime;

    console.log(`Concurrent retrieval time: ${totalTime}ms`);
    expect(totalTime).to.be.below(CONFIG.ACCEPTABLE_RESPONSE_TIME);
    results.forEach((res) => expect(res.status).to.equal(200));
  });

  it("should maintain performance for filtered queries", async () => {
    const products = Array(CONFIG.NUM_PRODUCTS)
      .fill()
      .map((_, i) => ({
        ...createTestProduct(i),
        price: 50 + i * 10,
      }));

    await Product.insertMany(products);

    const startTime = Date.now();
    const filterQueries = [
      request(app).get("/api/products").query({ minPrice: 100, maxPrice: 300 }),
      request(app).get("/api/products").query({ category: testCategory._id }),
      request(app).get("/api/products").query({ search: "Test" }),
    ];

    const results = await Promise.all(filterQueries);
    const totalTime = Date.now() - startTime;

    console.log(`Filter queries time: ${totalTime}ms`);
    expect(totalTime).to.be.below(CONFIG.ACCEPTABLE_RESPONSE_TIME);
    results.forEach((res) => expect(res.status).to.equal(200));
  });

  it("should handle pagination efficiently", async () => {
    const products = Array(CONFIG.NUM_PRODUCTS)
      .fill()
      .map((_, i) => createTestProduct(i));

    await Product.insertMany(products);

    const startTime = Date.now();
    const pageRequests = Array(5)
      .fill()
      .map((_, i) =>
        request(app)
          .get("/api/products")
          .query({ page: i + 1, perPage: 10 })
      );

    const results = await Promise.all(pageRequests);
    const totalTime = Date.now() - startTime;

    console.log(`Pagination time: ${totalTime}ms`);
    expect(totalTime).to.be.below(CONFIG.ACCEPTABLE_RESPONSE_TIME);
    results.forEach((res) => {
      expect(res.status).to.equal(200);
      expect(res.body.products).to.have.lengthOf.at.most(10);
    });
  });
});
