const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai");
const { Product } = require("../../models/products");
const { Category } = require("../../models/category");
const express = require("express");
const searchRoutes = require("../../routes/search");
require("dotenv").config({ path: "./.env.test" });

const app = express();
app.use(express.json());
app.use("/api/search", searchRoutes);

describe("Product Search Routes Integration Tests", function () {
  let testProducts;
  let testCategory;

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Product.deleteMany({});
    await Category.deleteMany({});

    // Create a test category
    testCategory = new Category({
      name: "Electronics",
      icon: "electronic-icon",
      color: "#000000",
      slug: "electronics",
    });
    await testCategory.save();

    testProducts = [
      new Product({
        name: "iPhone 12",
        description: "Latest iPhone",
        richDescription: "The latest iPhone with amazing features",
        image: "iphone12.jpg",
        images: ["iphone12-1.jpg", "iphone12-2.jpg"],
        brand: "Apple",
        price: 999,
        oldPrice: 1099,
        category: testCategory._id,
        countInStock: 100,
        rating: 4.5,
        numReviews: 100,
        isFeatured: true,
        dateCreated: new Date(),
        catName: "Electronics",
        discount: 10,
        productRam: "8GB",
        size: "6.1 inch",
        productWeight: "164g",
        location: [{ label: "All", value: "All" }],
        catId: testCategory._id.toString(),
        subCatId: testCategory._id.toString(),
        subCatName: "Smartphones",
        subCat: "Smartphones",
      }),
      new Product({
        name: "Samsung Galaxy",
        description: "Latest Samsung phone",
        richDescription: "The latest Samsung with amazing features",
        image: "samsung.jpg",
        images: ["samsung-1.jpg", "samsung-2.jpg"],
        brand: "Samsung",
        price: 899,
        oldPrice: 999,
        category: testCategory._id,
        countInStock: 80,
        rating: 4.3,
        numReviews: 90,
        isFeatured: true,
        dateCreated: new Date(),
        catName: "Electronics",
        discount: 15,
        productRam: "8GB",
        size: "6.2 inch",
        productWeight: "169g",
        location: [{ label: "All", value: "All" }],
        catId: testCategory._id.toString(),
        subCatId: testCategory._id.toString(),
        subCatName: "Smartphones",
        subCat: "Smartphones",
      }),
      new Product({
        name: "MacBook Pro",
        description: "Latest MacBook",
        richDescription: "The latest MacBook with amazing features",
        image: "macbook.jpg",
        images: ["macbook-1.jpg", "macbook-2.jpg"],
        brand: "Apple",
        price: 1299,
        oldPrice: 1499,
        category: testCategory._id,
        countInStock: 50,
        rating: 4.7,
        numReviews: 120,
        isFeatured: true,
        dateCreated: new Date(),
        catName: "Electronics",
        discount: 20,
        productRam: "16GB",
        size: "14 inch",
        productWeight: "1.6kg",
        location: [{ label: "All", value: "All" }],
        catId: testCategory._id.toString(),
        subCatId: testCategory._id.toString(),
        subCatName: "Laptops",
        subCat: "Laptops",
      }),
    ];

    for (let product of testProducts) {
      await product.save();
    }
  });

  afterEach(async () => {
    await Product.deleteMany({});
    await Category.deleteMany({});
  });

  describe("GET /", () => {
    it("should return 400 if query parameter is missing", async function () {
      const res = await request(app).get("/api/search");

      expect(res.status).to.equal(400);
      expect(res.body.msg).to.equal("Query is required");
    });

    it("should search products by name without pagination", async function () {
      const res = await request(app).get("/api/search").query({ q: "iPhone" });

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(1);
      expect(res.body[0].name).to.equal("iPhone 12");
    });

    it("should search products by brand without pagination", async function () {
      const res = await request(app).get("/api/search").query({ q: "Samsung" });

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(1);
      expect(res.body[0].brand).to.equal("Samsung");
    });

    it("should search products by category name without pagination", async function () {
      const res = await request(app)
        .get("/api/search")
        .query({ q: "Electronics" });

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(3);
      expect(res.body[0].catName).to.equal("Electronics");
    });

    it("should perform case-insensitive search", async function () {
      const res = await request(app).get("/api/search").query({ q: "iphone" });

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(1);
      expect(res.body[0].name).to.equal("iPhone 12");
    });

    it("should return paginated results with total pages", async function () {
      const res = await request(app)
        .get("/api/search")
        .query({ q: "Apple", page: 1, perPage: 2 });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("products");
      expect(res.body).to.have.property("totalPages");
      expect(res.body).to.have.property("page");
      expect(res.body.page).to.equal(1);
      expect(res.body.products).to.be.an("array");
      expect(res.body.products.length).to.be.at.most(2);
    });

    it("should handle search with no results", async function () {
      const res = await request(app)
        .get("/api/search")
        .query({ q: "NonexistentProduct" });

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(0);
    });

    it("should handle server errors", async function () {
      await mongoose.connection.close();

      const res = await request(app).get("/api/search").query({ q: "test" });

      expect(res.status).to.equal(500);
      expect(res.body.msg).to.equal("Server error");

      await mongoose.connect(process.env.CONNECTION_STRING);
    });
  });
});
