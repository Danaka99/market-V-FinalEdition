const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai");
const { ProductReviews } = require("../../models/productReviews");
const express = require("express");
const productReviewRoutes = require("../../routes/productReviews");
require("dotenv").config({ path: "./.env.test" });

const app = express();
app.use(express.json());
app.use("/api/product-reviews", productReviewRoutes);

describe("Product Review Routes Integration Tests", function () {
  let testReview;

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await ProductReviews.deleteMany({});

    testReview = new ProductReviews({
      customerId: "customer123",
      customerName: "John Doe",
      review: "Great product!",
      customerRating: 5,
      productId: "product123",
    });
    await testReview.save();
  });

  afterEach(async () => {
    await ProductReviews.deleteMany({});
  });

  describe("GET /", () => {
    it("should return all reviews when no productId is provided", async function () {
      const res = await request(app).get("/api/product-reviews");

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(1);
      expect(res.body[0]).to.have.property("customerName");
      expect(res.body[0].customerName).to.equal("John Doe");
    });

    it("should return reviews filtered by productId", async function () {
      const res = await request(app)
        .get("/api/product-reviews")
        .query({ productId: "product123" });

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(1);
      expect(res.body[0].productId).to.equal("product123");
    });

    it("should return empty array for non-existent productId", async function () {
      const res = await request(app)
        .get("/api/product-reviews")
        .query({ productId: "abcdef70b0456d455fa0c0af" });

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(0);
    });

    it("should handle empty product reviews list", async function () {
      await ProductReviews.deleteMany({});
      const res = await request(app).get("/api/product-reviews");

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(0);
    });
  });

  describe("GET /get/count", () => {
    it("should return correct count of reviews", async function () {
      const res = await request(app).get("/api/product-reviews/get/count");

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("productsReviews");
      expect(res.body.productsReviews).to.equal(1);
    });

    it("should return 0 when no reviews exist", async function () {
      await ProductReviews.deleteMany({});
      const res = await request(app).get("/api/product-reviews/get/count");

      expect(res.status).to.equal(500);
      expect(res.body.message).to.equal("No reviews found");
    });
  });

  describe("GET /:id", () => {
    it("should return review by id", async function () {
      const res = await request(app).get(
        `/api/product-reviews/${testReview.id}`
      );

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("customerName");
      expect(res.body.customerName).to.equal("John Doe");
      expect(res.body.productId).to.equal("product123");
    });

    it("should return 500 for invalid id", async function () {
      const res = await request(app).get(
        "/api/product-reviews/abcdef70b0456d455fa0c0af"
      );

      expect(res.status).to.equal(500);
      expect(res.body).to.have.property("message");
      expect(res.body.message).to.equal(
        "The review with the given ID was not found."
      );
    });
  });

  describe("POST /add", () => {
    it("should create new review", async function () {
      const newReview = {
        customerId: "customer456",
        customerName: "Jane Smith",
        review: "Excellent quality!",
        customerRating: 4,
        productId: "product456",
      };

      const res = await request(app)
        .post("/api/product-reviews/add")
        .send(newReview);

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property("_id");
      expect(res.body.customerName).to.equal("Jane Smith");
      expect(res.body.customerRating).to.equal(4);
      expect(res.body.productId).to.equal("product456");

      const reviewInDb = await ProductReviews.findById(res.body._id);
      expect(reviewInDb).to.exist;
      expect(reviewInDb.customerName).to.equal("Jane Smith");
    });

    it("should require all necessary fields", async function () {
      const incompleteReview = {
        customerName: "Jane Smith",
      };

      const res = await request(app)
        .post("/api/product-reviews/add")
        .send(incompleteReview);

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });
  });
});
