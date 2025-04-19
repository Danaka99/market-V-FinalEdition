const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai");
const { HomeSideBanners } = require("../../models/homeSideBanner");
const express = require("express");
const homeSideBannerRoutes = require("../../routes/homeSideBanner");
require("dotenv").config({ path: "./.env.test" });

const axios = require("axios");
const stream = require("stream");

const app = express();
app.use(express.json());
app.use("/api/homeSideBanners", homeSideBannerRoutes);

describe("HomeSideBanner Routes Integration Tests", function () {
  this.timeout(10000);

  let testBanner;

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await HomeSideBanners.deleteMany({});

    testBanner = new HomeSideBanners({
      images: ["image1.jpg"],
      catId: "123",
      catName: "Electronics",
      subCatId: "456",
      subCatName: "Laptops",
    });
    await testBanner.save();
  });

  afterEach(async () => {
    await HomeSideBanners.deleteMany({});
  });

  describe("GET /", () => {
    it("should return all home side banners", async function () {
      const res = await request(app).get("/api/homeSideBanners");
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(1);
      expect(res.body[0]).to.have.property("images");
      expect(res.body[0].catName).to.equal("Electronics");
    });

    it("should handle empty banner list", async function () {
      await HomeSideBanners.deleteMany({});
      const res = await request(app).get("/api/homeSideBanners");
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(0);
    });
  });

  describe("GET /:id", () => {
    it("should return banner by id", async function () {
      const res = await request(app).get(
        `/api/homeSideBanners/${testBanner.id}`
      );
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("images");
      expect(res.body.catName).to.equal("Electronics");
    });

    it("should return 500 for invalid id", async function () {
      const res = await request(app).get(
        "/api/homeSideBanners/abcdef70b0456d455fa0c0af"
      );
      expect(res.status).to.equal(500);
      expect(res.body.message).to.equal(
        "The Banner with the given ID was not found."
      );
    });
  });

  describe("POST /create", () => {
    it("should create new home side banner", async () => {
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
        .post("/api/homeSideBanners/upload")
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
        .post("/api/homeSideBanners/create")
        .send(newBanner)
        .catch((err) => {
          console.log(err);
        });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property("images").that.is.not.empty;
      expect(res.body.catName).to.equal("Clothing");

      const bannerInDb = await HomeSideBanners.findById(res.body.id);
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
        .put(`/api/homeSideBanners/${testBanner.id}`)
        .send(updateData);

      expect(res.status).to.equal(200);
      expect(res.body.catName).to.equal("Updated Category");

      const bannerInDb = await HomeSideBanners.findById(testBanner.id);
      expect(bannerInDb.catName).to.equal("Updated Category");
    });

    it("should return 500 for invalid update", async function () {
      const res = await request(app)
        .put("/api/homeSideBanners/abcdef70b0456d455fa0c0af")
        .send({ catName: "Test" });
      expect(res.status).to.equal(500);
      expect(res.body.message).to.equal("Item cannot be updated!");
    });
  });

  describe("DELETE /:id", () => {
    it("should delete existing banner", async function () {
      const res = await request(app).delete(
        `/api/homeSideBanners/${testBanner.id}`
      );
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Banner Deleted!");

      const bannerInDb = await HomeSideBanners.findById(testBanner.id);
      expect(bannerInDb).to.be.null;
    });

    it("should return 404 for non-existent banner", async function () {
      const res = await request(app).delete(
        `/api/homeSideBanners/abcdef70b0456d455fa0c0af`
      );
      expect(res.status).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("Banner not found!");
    });
  });

  describe("DELETE /deleteImage", () => {
    it("should handle image deletion request", async function () {
      const imageUrl = "https://res.cloudinary.com/test/image-to-delete.jpg";
      const res = await request(app)
        .delete("/api/homeSideBanners/deleteImage")
        .query({ img: imageUrl });
      expect(res.status).to.equal(200);
    });
  });
});
