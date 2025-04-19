const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai");
const { HomeBottomBanners } = require("../../models/homeBottomBanner");
const express = require("express");
const homeBottomBannersRoutes = require("../../routes/homeBottomBanner");
require("dotenv").config({ path: "./.env.test" });

const axios = require("axios");
const stream = require("stream");

const app = express();
app.use(express.json());
app.use("/api/homeBottomBanners", homeBottomBannersRoutes);

describe("HomeBottomBanners Routes Integration Tests", function () {
  this.timeout(10000);

  let testBanner;

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await HomeBottomBanners.deleteMany({});

    testBanner = new HomeBottomBanners({
      images: ["test-image1.jpg", "test-image2.jpg"],
      catId: "category123",
      catName: "Electronics",
      subCatId: "subcategory456",
      subCatName: "Laptops",
    });
    await testBanner.save();
  });

  afterEach(async () => {
    await HomeBottomBanners.deleteMany({});
  });

  describe("GET /", () => {
    it("should return all bottom banners", async function () {
      const res = await request(app).get("/api/homeBottomBanners");
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(1);
      expect(res.body[0]).to.have.property("images");
      expect(res.body[0].catName).to.equal("Electronics");
      expect(res.body[0].subCatName).to.equal("Laptops");
    });

    it("should handle empty banner list", async function () {
      await HomeBottomBanners.deleteMany({});
      const res = await request(app).get("/api/homeBottomBanners");
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(0);
    });
  });

  describe("GET /:id", () => {
    it("should return banner by id", async function () {
      const res = await request(app).get(
        `/api/homeBottomBanners/${testBanner.id}`
      );
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("images");
      expect(res.body.catId).to.equal("category123");
      expect(res.body.subCatName).to.equal("Laptops");
    });

    it("should return 500 for invalid id", async function () {
      const res = await request(app).get(
        "/api/homeBottomBanners/abcdef70b0456d455fa0c0af"
      );
      expect(res.status).to.equal(500);
      expect(res.body).to.have.property("message");
      expect(res.body.message).to.equal(
        "The Banner with the given ID was not found."
      );
    });
  });

  describe("POST /create", () => {
    it("should create new bottom banner with images and category info", async () => {
      this.timeout(20000);

      const imageUrl =
        "https://www.google.com/images/branding/googlelogo/1x/googlelogo_dark_color_272x92dp.png";
      const imageBuffer = await axios
        .get(imageUrl, { responseType: "arraybuffer" })
        .then((response) => response.data)
        .catch((err) => {
          console.log("Error fetching image: ", err);
          throw new Error("Failed to fetch image");
        });

      const imageStream = new stream.PassThrough();
      imageStream.end(imageBuffer);

      const imageUploadResponse = await request(app)
        .post("/api/homeBottomBanners/upload")
        .attach("images", imageStream, { filename: "test-banner.png" });

      expect(imageUploadResponse.status).to.equal(200);
      expect(imageUploadResponse.body).to.be.an("array").that.is.not.empty;

      const newBanner = {
        catId: "newCategory123",
        catName: "Furniture",
        subCatId: "newSubCategory456",
        subCatName: "Sofas",
      };

      const res = await request(app)
        .post("/api/homeBottomBanners/create")
        .send(newBanner);

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property("images").that.is.an("array");
      expect(res.body.catName).to.equal("Furniture");
      expect(res.body.subCatName).to.equal("Sofas");

      const bannerInDb = await HomeBottomBanners.findById(res.body._id);
      expect(bannerInDb).to.exist;
      expect(bannerInDb.catId).to.equal("newCategory123");
    });
  });

  describe("PUT /:id", () => {
    it("should update existing banner with all fields", async function () {
      const updateData = {
        images: ["updated-image1.jpg"],
        catId: "updatedCat123",
        catName: "Updated Category",
        subCatId: "updatedSubCat456",
        subCatName: "Updated SubCategory",
      };

      const res = await request(app)
        .put(`/api/homeBottomBanners/${testBanner.id}`)
        .send(updateData);

      expect(res.status).to.equal(200);
      expect(res.body.catName).to.equal("Updated Category");
      expect(res.body.subCatName).to.equal("Updated SubCategory");

      const bannerInDb = await HomeBottomBanners.findById(testBanner.id);
      expect(bannerInDb.catId).to.equal("updatedCat123");
      expect(bannerInDb.images[0]).to.equal("updated-image1.jpg");
    });

    it("should return 500 for invalid update", async function () {
      const res = await request(app)
        .put("/api/homeBottomBanners/abcdef70b0456d455fa0c0af")
        .send({ catName: "Test" });
      expect(res.status).to.equal(500);
      expect(res.body).to.have.property("message", "Item cannot be updated!");
    });
  });

  describe("DELETE /:id", () => {
    it("should delete existing banner and its images", async function () {
      const res = await request(app).delete(
        `/api/homeBottomBanners/${testBanner.id}`
      );
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Banner Deleted!");

      const bannerInDb = await HomeBottomBanners.findById(testBanner.id);
      expect(bannerInDb).to.be.null;
    });

    it("should return 404 for non-existent banner", async function () {
      await HomeBottomBanners.deleteMany({});
      const res = await request(app).delete(
        `/api/homeBottomBanners/${testBanner.id}`
      );
      expect(res.status).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("Banner not found!");
    });
  });

  describe("DELETE /deleteImage", () => {
    it("should handle single image deletion from cloudinary", async function () {
      const imageUrl = "https://res.cloudinary.com/test/image-to-delete.jpg";
      const res = await request(app)
        .delete("/api/homeBottomBanners/deleteImage")
        .query({ img: imageUrl });
      expect(res.status).to.equal(200);
    });
  });
});
