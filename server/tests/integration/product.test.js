const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai");
const { Product } = require("../../models/products");
const { Category } = require("../../models/category");
const express = require("express");
const productRoutes = require("../../routes/products");
require("dotenv").config({ path: "./.env.test" });

const axios = require("axios");
const stream = require("stream");

const app = express();
app.use(express.json());
app.use("/api/products", productRoutes);

describe("Product Routes Integration Tests", function () {
  this.timeout(15000);

  let testProduct;
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

    testCategory = new Category({
      name: "Electronics",
      icon: "electronics-icon",
      color: "#000000",
      slug: "electronics",
      image: "category-image.jpg",
      catId: "123",
      menuId: "456",
    });
    await testCategory.save();

    testProduct = new Product({
      name: "Test Product",
      description: "Test Description",
      images: ["image1.jpg"],
      brand: "Test Brand",
      price: 999,
      oldPrice: 1299,
      catId: testCategory.catId,
      catName: "Electronics",
      subCat: "Laptops",
      subCatId: "456",
      category: testCategory._id,
      countInStock: 10,
      rating: 4.5,
      isFeatured: true,
      discount: 20,
      productRam: ["8GB", "16GB"],
      size: ["13inch", "15inch"],
      productWeight: ["1.5kg"],
      location: [{ value: "NY", label: "New York" }],
    });
    await testProduct.save();
  });

  afterEach(async () => {
    await Product.deleteMany({});
    await Category.deleteMany({});
  });

  describe("GET /", () => {
    it("should return paginated products", async () => {
      const res = await request(app)
        .get("/api/products")
        .query({ page: 1, perPage: 10 });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("products");
      expect(res.body).to.have.property("totalPages");
      expect(res.body).to.have.property("page");
      expect(res.body.products).to.be.an("array");
    });

    it("should filter products by location", async () => {
      const res = await request(app)
        .get("/api/products")
        .query({ page: 1, perPage: 10, location: "NY" });

      expect(res.status).to.equal(200);
      expect(res.body.products[0].location[0].value).to.equal("NY");
    });

    it("should return 404 for invalid page", async () => {
      const res = await request(app)
        .get("/api/products")
        .query({ page: 999, perPage: 10 });

      expect(res.status).to.equal(404);
    });
  });

  describe("GET /catName", () => {
    it("should return products by category name", async () => {
      const res = await request(app)
        .get("/api/products/catName")
        .query({ catName: "Electronics", page: 1, perPage: 10 });

      expect(res.status).to.equal(200);
      expect(res.body.products[0].catName).to.equal("Electronics");
    });
  });

  describe("GET /featured", () => {
    it("should return featured products", async () => {
      const res = await request(app).get("/api/products/featured");

      expect(res.status).to.equal(200);
      expect(res.body[0].isFeatured).to.be.true;
    });

    it("should filter featured products by location", async () => {
      const res = await request(app)
        .get("/api/products/featured")
        .query({ location: "NY" });

      expect(res.status).to.equal(200);
      expect(res.body[0].location[0].value).to.equal("NY");
    });
  });

  describe("POST /create", () => {
    it("should create new product", async () => {
      const imageUrl =
        "https://www.google.com/images/branding/googlelogo/1x/googlelogo_dark_color_272x92dp.png";
      const imageBuffer = await axios
        .get(imageUrl, { responseType: "arraybuffer" })
        .then((response) => response.data);

      const imageStream = new stream.PassThrough();
      imageStream.end(imageBuffer);

      const imageUploadResponse = await request(app)
        .post("/api/products/upload")
        .attach("images", imageStream, { filename: "test-product.png" });

      expect(imageUploadResponse.status).to.equal(200);

      const newProduct = {
        name: "New Product",
        description: "New Description",
        brand: "New Brand",
        price: 799,
        category: testCategory._id,
        countInStock: 5,
        discount: 10,
        location: [{ value: "LA", label: "Los Angeles" }],
      };

      const res = await request(app)
        .post("/api/products/create")
        .send(newProduct);

      expect(res.status).to.equal(201);
      expect(res.body.name).to.equal("New Product");

      const productInDb = await Product.findById(res.body.id);
      expect(productInDb).to.exist;
    });

    it("should return 404 for invalid category", async () => {
      const res = await request(app).post("/api/products/create").send({
        name: "Test Product",
        description: "Test Description",
        category: new mongoose.Types.ObjectId(),
      });

      expect(res.status).to.equal(404);
      expect(res.text).to.equal("invalid Category!");
    });
  });

  describe("PUT /:id", () => {
    it("should update existing product", async () => {
      const updateData = {
        name: "Updated Product",
        price: 899,
        category: testCategory._id,
        description: "Updated Description",
        countInStock: 15,
        discount: 25,
      };

      const res = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .send(updateData);

      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal("the product is updated!");

      const productInDb = await Product.findById(testProduct.id);
      expect(productInDb.name).to.equal("Updated Product");
    });
  });

  describe("DELETE /:id", () => {
    it("should delete product and related items", async () => {
      const res = await request(app).delete(`/api/products/${testProduct.id}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Product Deleted!");

      const productInDb = await Product.findById(testProduct.id);
      expect(productInDb).to.be.null;
    });
  });

  describe("GET /get/count", () => {
    it("should return total product count", async () => {
      const res = await request(app).get("/api/products/get/count");

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("productsCount");
      expect(res.body.productsCount).to.be.a("number");
    });
  });

  describe("GET /fiterByPrice", () => {
    it("should filter products by price range", async () => {
      const res = await request(app).get("/api/products/fiterByPrice").query({
        catId: testCategory.catId,
        minPrice: "500",
        maxPrice: "1000",
      });

      expect(res.status).to.equal(200);
      expect(res.body.products).to.be.an("array");
      res.body.products.forEach((product) => {
        expect(product.price).to.be.within(500, 1000);
      });
    });
  });

  describe("GET /rating", () => {
    it("should filter products by rating", async () => {
      const res = await request(app).get("/api/products/rating").query({
        catId: testCategory.catId,
        rating: "4.5",
      });

      expect(res.status).to.equal(200);
      expect(res.body.products).to.be.an("array");
      res.body.products.forEach((product) => {
        expect(product.rating).to.equal(4.5);
      });
    });
  });
});
