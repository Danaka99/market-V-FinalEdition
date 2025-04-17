const chai = require("chai");
const mongoose = require("mongoose");
const { Cart } = require("../../../models/cart");
require("dotenv").config({ path: "./.env.test" });

const expect = chai.expect;

describe("Cart Model", () => {
  let cart;

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(() => {
    cart = new Cart({
      productTitle: "Laptop",
      image: "laptop.jpg",
      rating: 4.5,
      price: 1000,
      quantity: 2,
      subTotal: 2000,
      productId: "12345",
      countInStock: 5,
      userId: "user123",
    });
  });

  afterEach(async () => {
    await Cart.deleteMany({});
  });

  it("should create a valid cart with all fields", () => {
    expect(cart).to.have.property("productTitle").to.equal("Laptop");
    expect(cart).to.have.property("image").to.equal("laptop.jpg");
    expect(cart).to.have.property("rating").to.equal(4.5);
    expect(cart).to.have.property("price").to.equal(1000);
    expect(cart).to.have.property("quantity").to.equal(2);
    expect(cart).to.have.property("subTotal").to.equal(2000);
    expect(cart).to.have.property("productId").to.equal("12345");
    expect(cart).to.have.property("countInStock").to.equal(5);
    expect(cart).to.have.property("userId").to.equal("user123");
  });

  it("should be invalid if any required field is missing", async () => {
    const invalidCart = new Cart({
      productTitle: "Laptop",
      image: "laptop.jpg",
      rating: 4.5,
      price: 1000,
      quantity: 1,
      subTotal: 1000,
      countInStock: 5,
      userId: "user123",
    });

    try {
      await invalidCart.validate();
      expect.fail("Validation should have failed due to missing productId");
    } catch (err) {
      expect(err).to.exist;
      expect(err.errors).to.have.property("productId");
    }
  });

  it("should generate virtual id field", () => {
    expect(cart).to.have.property("id");
    expect(cart.id).to.be.a("string");
    expect(cart.toJSON()).to.have.property("id");
  });

  it("should calculate subTotal based on price and quantity", () => {
    const expectedSubTotal = cart.price * cart.quantity;
    expect(cart.subTotal).to.equal(expectedSubTotal);
  });

  it("should allow missing optional fields", async () => {
    const cartWithMissingOptionalField = new Cart({
      productTitle: "Laptop",
      image: "laptop.jpg",
      rating: 4.5,
      price: 1000,
      quantity: 1,
      subTotal: 1000,
      productId: "product123",
      userId: "user123",
    });

    try {
      await cartWithMissingOptionalField.validate();
    } catch (err) {
      expect.fail(
        "Validation should not have failed when optional fields are missing"
      );
    }
  });

  it("should throw error for negative quantity", async () => {
    const cartWithNegativeQuantity = new Cart({
      productTitle: "Laptop",
      image: "laptop.jpg",
      rating: 4.5,
      price: 1000,
      quantity: -1,
      subTotal: 1000,
      productId: "12345",
      countInStock: 5,
      userId: "user123",
    });

    try {
      await cartWithNegativeQuantity.validate();
      expect.fail("Validation should have failed");
    } catch (err) {
      expect(err).to.exist;
      expect(err.errors).to.have.property("quantity");
      expect(err.errors.quantity.message).to.equal(
        "Quantity must be a positive number or zero"
      );
    }
  });
});
