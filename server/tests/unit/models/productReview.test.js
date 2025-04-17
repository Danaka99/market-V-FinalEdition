const chai = require("chai");
const mongoose = require("mongoose");
const { ProductReviews } = require("../../../models/productReviews");
require("dotenv").config({ path: "./.env.test" });
const expect = chai.expect;

describe("ProductReviews Model", () => {
  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await ProductReviews.deleteMany({});
  });

  it("should create a valid product review", async () => {
    const review = new ProductReviews({
      productId: "12345",
      customerName: "John Doe",
      customerId: "67890",
      review: "Great product!",
      customerRating: 5,
    });

    const savedReview = await review.save();
    expect(savedReview._id).to.exist;
    expect(savedReview.customerRating).to.equal(5);
  });

  it("should fail validation without required fields", async () => {
    const review = new ProductReviews({});

    const validationError = review.validateSync();

    expect(validationError).to.exist;
    expect(validationError.errors.productId).to.exist;
    expect(validationError.errors.customerName).to.exist;
    expect(validationError.errors.customerId).to.exist;
    expect(validationError.errors.review).to.exist;
  });

  it("should set default values correctly", async () => {
    const review = new ProductReviews({
      productId: "12345",
      customerName: "John Doe",
      customerId: "67890",
      review: "Test review",
      customerRating: 4,
    });

    expect(review.dateCreated).to.be.instanceOf(Date);
    expect(review.review).to.equal("Test review");
    expect(review.customerRating).to.equal(4);
  });

  it("should generate virtual id field", async () => {
    const review = new ProductReviews({
      productId: "12345",
      customerName: "John Doe",
      customerId: "67890",
      review: "Test review",
      customerRating: 4,
    });

    const savedReview = await review.save();
    expect(savedReview.id).to.be.a("string");
    expect(savedReview.id).to.equal(savedReview._id.toHexString());
  });
});
