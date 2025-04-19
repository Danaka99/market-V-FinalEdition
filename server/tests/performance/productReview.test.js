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

describe("Product Reviews API Performance Tests", function () {
  this.timeout(60000);

  const TEST_CONFIG = {
    NUM_REVIEWS: 100,
    BATCH_SIZE: 10,
    RESPONSE_TIME_THRESHOLD: 1000,
    CONCURRENT_REQUESTS: 50,
  };

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
    await ProductReviews.deleteMany({});
  });

  after(async () => {
    await ProductReviews.deleteMany({});
    await mongoose.connection.close();
  });

  it("should handle bulk creation of reviews efficiently", async () => {
    const reviews = Array(TEST_CONFIG.NUM_REVIEWS)
      .fill()
      .map((_, i) => ({
        customerId: `customer${i}`,
        customerName: `Customer ${i}`,
        review: `Test review ${i}`,
        customerRating: (i % 5) + 1,
        productId: `product${Math.floor(i / 10)}`,
      }));

    const startTime = Date.now();

    for (let i = 0; i < reviews.length; i += TEST_CONFIG.BATCH_SIZE) {
      const batch = reviews.slice(i, i + TEST_CONFIG.BATCH_SIZE);
      const promises = batch.map((review) =>
        request(app).post("/api/product-reviews/add").send(review)
      );
      const results = await Promise.all(promises);
      results.forEach((res) => {
        expect(res.status).to.equal(201);
        expect(res.body).to.have.property("customerName");
      });
    }

    const endTime = Date.now();
    const avgTimePerRequest = (endTime - startTime) / TEST_CONFIG.NUM_REVIEWS;

    console.log(`Average time per review creation: ${avgTimePerRequest}ms`);
    expect(avgTimePerRequest).to.be.below(TEST_CONFIG.RESPONSE_TIME_THRESHOLD);
  });

  it("should handle concurrent GET requests efficiently", async () => {
    const startTime = Date.now();

    const promises = Array(TEST_CONFIG.CONCURRENT_REQUESTS)
      .fill()
      .map(() => request(app).get("/api/product-reviews"));

    const results = await Promise.all(promises);
    const endTime = Date.now();

    results.forEach((res) => {
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
    });

    const avgTimePerRequest =
      (endTime - startTime) / TEST_CONFIG.CONCURRENT_REQUESTS;
    console.log(
      `Average time per concurrent GET request: ${avgTimePerRequest}ms`
    );
    expect(avgTimePerRequest).to.be.below(TEST_CONFIG.RESPONSE_TIME_THRESHOLD);
  });

  it("should maintain performance for filtered product reviews", async () => {
    const productId = "product0";
    const startTime = Date.now();

    const promises = Array(TEST_CONFIG.CONCURRENT_REQUESTS)
      .fill()
      .map(() => request(app).get("/api/product-reviews").query({ productId }));

    const results = await Promise.all(promises);
    const endTime = Date.now();

    results.forEach((res) => {
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      res.body.forEach((review) => {
        expect(review.productId).to.equal(productId);
      });
    });

    const avgTimePerRequest =
      (endTime - startTime) / TEST_CONFIG.CONCURRENT_REQUESTS;
    console.log(`Average time per filtered request: ${avgTimePerRequest}ms`);
    expect(avgTimePerRequest).to.be.below(TEST_CONFIG.RESPONSE_TIME_THRESHOLD);
  });

  it("should handle review count requests under load", async () => {
    const startTime = Date.now();

    const promises = Array(TEST_CONFIG.CONCURRENT_REQUESTS)
      .fill()
      .map(() => request(app).get("/api/product-reviews/get/count"));

    const results = await Promise.all(promises);
    const endTime = Date.now();

    results.forEach((res) => {
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("productsReviews");
      expect(res.body.productsReviews).to.equal(TEST_CONFIG.NUM_REVIEWS);
    });

    const avgTimePerRequest =
      (endTime - startTime) / TEST_CONFIG.CONCURRENT_REQUESTS;
    console.log(`Average time per count request: ${avgTimePerRequest}ms`);
    expect(avgTimePerRequest).to.be.below(TEST_CONFIG.RESPONSE_TIME_THRESHOLD);
  });
});
