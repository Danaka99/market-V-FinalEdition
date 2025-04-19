const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai");
const { Banner } = require("../../models/banners");
const express = require("express");
const bannerRoutes = require("../../routes/banners");
require("dotenv").config({ path: "./.env.test" });

const axios = require("axios");
const stream = require("stream");

const app = express();
app.use(express.json());
app.use("/api/banners", bannerRoutes);

describe("Banner Routes Integration Tests", function () {
  this.timeout(10000);

  let testBanner;

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Banner.deleteMany({});

    testBanner = new Banner({
      images: ["image1.jpg"],
      catId: "123",
      catName: "Electronics",
      subCatId: "456",
      subCatName: "Laptops",
    });
    await testBanner.save();
  });

  afterEach(async () => {
    await Banner.deleteMany({});
  });

  describe("GET /", () => {
    it("should return all banners", async function () {
      const res = await request(app).get("/api/banners");
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(1);
      expect(res.body[0]).to.have.property("images");
      expect(res.body[0].catName).to.equal("Electronics");
    });

    it("should handle empty banner list", async function () {
      await Banner.deleteMany({});
      const res = await request(app).get("/api/banners");
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(0);
    });
  });

  describe("GET /:id", () => {
    it("should return banner by id", async function () {
      const res = await request(app).get(`/api/banners/${testBanner.id}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("images");
      expect(res.body.catName).to.equal("Electronics");
    });

    it("should return 500 for invalid id", async function () {
      const res = await request(app).get(
        "/api/banners/abcdef70b0456d455fa0c0af"
      );
      expect(res.status).to.equal(500);
    });
  });

  describe("POST /create", () => {
    it("should create new banner", async () => {
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
        .post("/api/banners/upload")
        .attach("images", imageStream, {
          filename: "googlelogo_dark_color_272x92dp.png",
        })
        .catch((err) => {
          console.log("Upload image res: " + err);
        });

      expect(imageUploadResponse.status).to.equal(200);
      expect(imageUploadResponse.body).to.be.an("array").that.is.not.empty;

      const uploadImages = imageUploadResponse.body;

      const newBanner = {
        images: uploadImages,
        catId: "789",
        catName: "Clothing",
        subCatId: "012",
        subCatName: "Shirts",
      };

      const res = await request(app)
        .post("/api/banners/create")
        .send(newBanner)
        .catch((err) => {
          console.log(err);
        });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property("images").that.is.not.empty;
      expect(res.body.catName).to.equal("Clothing");

      const bannerInDb = await Banner.findById(res.body.id);
      expect(bannerInDb).to.exist;
      expect(bannerInDb.catName).to.equal("Clothing");
    });
  });

  describe("PUT /:id", () => {
    it("should update existing banner", async function () {
      const updateData = {
        images: ["https://res.cloudinary.com/test/updated.jpg"],
        catName: "Updated Category",
        subCatName: "Updated SubCategory",
      };

      const res = await request(app)
        .put(`/api/banners/${testBanner.id}`)
        .send(updateData);

      expect(res.status).to.equal(200);
      expect(res.body.catName).to.equal("Updated Category");

      const bannerInDb = await Banner.findById(testBanner.id);
      expect(bannerInDb.catName).to.equal("Updated Category");
    });

    it("should return 500 for invalid update", async function () {
      const res = await request(app)
        .put("/api/banners/abcdef70b0456d455fa0c0af")
        .send({ catName: "Test" });
      expect(res.status).to.equal(500);
    });
  });

  describe("DELETE /:id", () => {
    it("should delete existing banner", async function () {
      const res = await request(app).delete(`/api/banners/${testBanner.id}`);
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;

      const bannerInDb = await Banner.findById(testBanner.id);
      expect(bannerInDb).to.be.null;
    });

    it("should return 404 for non-existent banner", async function () {
      const res = await request(app).delete(
        `/api/banners/abcdef70b0456d455fa0c0af`
      );
      console.log("Status: ", res.status);
      expect(res.status).to.equal(404);
      expect(res.body.success).to.be.false;
    });
  });

  describe("DELETE /deleteImage", () => {
    it("should handle image deletion request", async function () {
      const imageUrl = "https://res.cloudinary.com/test/image-to-delete.jpg";
      const res = await request(app)
        .delete("/api/banners/deleteImage")
        .query({ img: imageUrl });
      expect(res.status).to.equal(200);
    });
  });
});
