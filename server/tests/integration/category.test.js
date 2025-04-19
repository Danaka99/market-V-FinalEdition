const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai");
const { Category } = require("../../models/category");
const express = require("express");
const categoryRoutes = require("../../routes/categories");
require("dotenv").config({ path: "./.env.test" });

const axios = require("axios");
const stream = require("stream");

const app = express();
app.use(express.json());
app.use("/api/category", categoryRoutes);

describe("Category Routes Integration Tests", function () {
  this.timeout(10000);

  let testCategory;
  let testSubCategory;

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Category.deleteMany({});

    testCategory = new Category({
      name: "Electronics",
      images: ["image1.jpg"],
      color: "#FF0000",
      slug: "electronics",
    });
    await testCategory.save();

    testSubCategory = new Category({
      name: "Laptops",
      images: ["image2.jpg"],
      color: "#00FF00",
      slug: "laptops",
      parentId: testCategory._id,
    });
    await testSubCategory.save();
  });

  afterEach(async () => {
    await Category.deleteMany({});
  });

  describe("GET /", () => {
    it("should return hierarchical category list", async function () {
      const res = await request(app).get("/api/category");
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("categoryList");
      expect(res.body.categoryList).to.be.an("array");
      expect(res.body.categoryList).to.have.lengthOf(1);
      expect(res.body.categoryList[0].children).to.have.lengthOf(1);
      expect(res.body.categoryList[0].name).to.equal("Electronics");
      expect(res.body.categoryList[0].children[0].name).to.equal("Laptops");
    });

    it("should handle empty category list", async function () {
      await Category.deleteMany({});
      const res = await request(app).get("/api/category");
      expect(res.status).to.equal(200);
      expect(res.body.categoryList).to.be.an("array");
      expect(res.body.categoryList).to.have.lengthOf(0);
    });
  });

  describe("GET /get/count", () => {
    it("should return count of parent category", async function () {
      const res = await request(app).get("/api/category/get/count");
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("categoryCount");
      expect(res.body.categoryCount).to.equal(1);
    });
  });

  describe("GET /subCat/get/count", () => {
    it("should return count of subcategory", async function () {
      const res = await request(app).get("/api/category/subCat/get/count");
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("categoryCount");
      expect(res.body.categoryCount).to.equal(1);
    });
  });

  describe("GET /:id", () => {
    it("should return category by id with children", async function () {
      const res = await request(app).get(`/api/category/${testCategory.id}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("categoryData");
      expect(res.body.categoryData[0].name).to.equal("Electronics");
      expect(res.body.categoryData[0].children).to.have.lengthOf(1);
    });

    it("should return 500 for invalid id", async function () {
      const res = await request(app).get("/api/category/invalidid123");
      expect(res.status).to.equal(500);
    });
  });

  describe("POST /create", () => {
    it("should create new category", async () => {
      this.timeout(20000);

      const imageUrl =
        "https://www.google.com/images/branding/googlelogo/1x/googlelogo_dark_color_272x92dp.png";

      const imageBuffer = await axios
        .get(imageUrl, { responseType: "arraybuffer" })
        .then((response) => response.data);

      const imageStream = new stream.PassThrough();
      imageStream.end(imageBuffer);

      const imageUploadResponse = await request(app)
        .post("/api/category/upload")
        .attach("images", imageStream, { filename: "test-image.png" });

      expect(imageUploadResponse.status).to.equal(200);
      expect(imageUploadResponse.body).to.be.an("array").that.is.not.empty;

      const uploadedImages = imageUploadResponse.body;

      const newCategory = {
        name: "Furniture",
        color: "#0000FF",
        images: uploadedImages,
      };

      const res = await request(app)
        .post("/api/category/create")
        .send(newCategory);

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property("name", "Furniture");
      expect(res.body).to.have.property("slug", "Furniture");
      expect(res.body).to.have.property("images").that.is.an("array");

      const categoryInDb = await Category.findById(res.body._id);
      expect(categoryInDb).to.exist;
      expect(categoryInDb.name).to.equal("Furniture");
    });

    it("should create subcategory with parentId", async () => {
      const newSubCategory = {
        name: "Desktop Computers",
        parentId: testCategory._id,
      };

      const res = await request(app)
        .post("/api/category/create")
        .send(newSubCategory);

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property("parentId", testCategory.id);
    });
  });

  describe("PUT /:id", () => {
    it("should update existing category", async function () {
      const updateData = {
        name: "Updated Electronics",
        color: "#00FF00",
        images: ["updated-image.jpg"],
      };

      const res = await request(app)
        .put(`/api/category/${testCategory.id}`)
        .send(updateData);

      expect(res.status).to.equal(200);
      expect(res.body.name).to.equal("Updated Electronics");

      const categoryInDb = await Category.findById(testCategory.id);
      expect(categoryInDb.name).to.equal("Updated Electronics");
    });

    it("should return 500 for invalid update", async function () {
      const res = await request(app)
        .put("/api/category/abcdef70b0456d455fa0c0af")
        .send({ name: "Test" });
      expect(res.status).to.equal(500);
    });
  });

  describe("DELETE /:id", () => {
    it("should delete category and its images from cloudinary", async function () {
      const res = await request(app).delete(`/api/category/${testCategory.id}`);
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;

      const categoryInDb = await Category.findById(testCategory.id);
      expect(categoryInDb).to.be.null;
    });

    it("should return 404 for non-existent category", async function () {
      await Category.deleteMany({});
      const res = await request(app).delete(`/api/category/${testCategory.id}`);

      expect(res.status).to.equal(404);
      expect(res.body.success).to.be.false;
    });
  });

  describe("DELETE /deleteImage", () => {
    it("should handle image deletion from cloudinary", async function () {
      const imageUrl = "https://res.cloudinary.com/test/image-to-delete.jpg";
      const res = await request(app)
        .delete("/api/category/deleteImage")
        .query({ img: imageUrl });
      expect(res.status).to.equal(200);
    });
  });
});
