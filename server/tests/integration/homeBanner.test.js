const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai");
const { HomeBanner } = require("../../models/homeBanner");
const express = require("express");
const homeBannerRoutes = require("../../routes/homeBanner");
require("dotenv").config({ path: "./.env.test" });

const axios = require("axios");
const stream = require("stream");

const app = express();
app.use(express.json());
app.use("/api/home-banners", homeBannerRoutes);

describe("HomeBanner Routes Integration Tests", function () {
  this.timeout(10000);

  let testBanner;

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await HomeBanner.deleteMany({});

    testBanner = new HomeBanner({
      images: ["test-image1.jpg", "test-image2.jpg"],
    });
    await testBanner.save();
  });

  afterEach(async () => {
    await HomeBanner.deleteMany({});
  });

  describe("GET /", () => {
    it("should return all home banners", async function () {
      const res = await request(app).get("/api/home-banners");
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(1);
      expect(res.body[0]).to.have.property("images");
      expect(res.body[0].images).to.be.an("array");
      expect(res.body[0].images).to.have.lengthOf(2);
    });

    it("should handle empty banner list", async function () {
      await HomeBanner.deleteMany({});
      const res = await request(app).get("/api/home-banners");
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(0);
    });
  });

  describe("GET /:id", () => {
    it("should return banner by id", async function () {
      const res = await request(app).get(`/api/home-banners/${testBanner.id}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("images");
      expect(res.body.images).to.be.an("array");
      expect(res.body.images).to.have.lengthOf(2);
    });

    it("should return 500 for invalid id", async function () {
      const res = await request(app).get(
        "/api/home-banners/abcdef70b0456d455fa0c0af"
      );
      expect(res.status).to.equal(500);
      expect(res.body).to.have.property("message");
      expect(res.body.message).to.equal(
        "The slide with the given ID was not found."
      );
    });
  });

  describe("POST /create", () => {
    it("should create new home banner with uploaded images", async () => {
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
        .post("/api/home-banners/upload")
        .attach("images", imageStream, { filename: "test-banner.png" });

      expect(imageUploadResponse.status).to.equal(200);
      expect(imageUploadResponse.body).to.be.an("array").that.is.not.empty;

      const res = await request(app).post("/api/home-banners/create").send({});

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property("images").that.is.an("array");

      const bannerInDb = await HomeBanner.findById(res.body._id);
      expect(bannerInDb).to.exist;
      expect(bannerInDb.images).to.be.an("array").that.is.not.empty;
    });
  });

  describe("PUT /:id", () => {
    it("should update existing banner", async function () {
      const updateData = {
        images: ["updated-image1.jpg", "updated-image2.jpg"],
      };

      const res = await request(app)
        .put(`/api/home-banners/${testBanner.id}`)
        .send(updateData);

      expect(res.status).to.equal(200);
      expect(res.body.images).to.deep.equal(updateData.images);

      const bannerInDb = await HomeBanner.findById(testBanner.id);
      expect(bannerInDb.images).to.deep.equal(updateData.images);
    });

    it("should return 500 for invalid update", async function () {
      const res = await request(app)
        .put("/api/home-banners/abcdef70b0456d455fa0c0af")
        .send({ images: ["test.jpg"] });
      expect(res.status).to.equal(500);
      expect(res.body).to.have.property("message", "Item cannot be updated!");
    });
  });

  describe("DELETE /:id", () => {
    it("should delete existing banner and its images", async function () {
      const res = await request(app).delete(
        `/api/home-banners/${testBanner.id}`
      );
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Slide Deleted!");

      const bannerInDb = await HomeBanner.findById(testBanner.id);
      expect(bannerInDb).to.be.null;
    });

    it("should return 404 for non-existent banner", async function () {
      await HomeBanner.deleteMany({});
      const res = await request(app).delete(
        `/api/home-banners/${testBanner.id}`
      );
      expect(res.status).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("Slide not found!");
    });
  });

  describe("DELETE /deleteImage", () => {
    it("should handle single image deletion from cloudinary", async function () {
      const imageUrl = "https://res.cloudinary.com/test/image-to-delete.jpg";
      const res = await request(app)
        .delete("/api/home-banners/deleteImage")
        .query({ img: imageUrl });
      expect(res.status).to.equal(200);
    });
  });
});
