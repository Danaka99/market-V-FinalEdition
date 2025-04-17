const chai = require("chai");
const mongoose = require("mongoose");
const { Orders } = require("../../../models/orders");
require("dotenv").config({ path: "./.env.test" });
const expect = chai.expect;

describe("Orders Model", () => {
  let order;

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(() => {
    order = new Orders({
      name: "John Doe",
      phoneNumber: "1234567890",
      address: "123 Test St",
      pincode: "12345",
      amount: "99.99",
      paymentId: "pay_123",
      email: "test@test.com",
      userid: "user123",
      products: [
        {
          productId: "prod123",
          productTitle: "Test Product",
          quantity: 2,
          price: 49.99,
          image: "test.jpg",
          subTotal: 99.98,
        },
      ],
    });
  });

  afterEach(async () => {
    await Orders.deleteMany({});
  });

  it("should create a valid order with all required fields", async () => {
    await order.validate();
    expect(order.name).to.equal("John Doe");
    expect(order.phoneNumber).to.equal("1234567890");
    expect(order.address).to.equal("123 Test St");
    expect(order.pincode).to.equal("12345");
    expect(order.amount).to.equal("99.99");
    expect(order.paymentId).to.equal("pay_123");
    expect(order.email).to.equal("test@test.com");
    expect(order.userid).to.equal("user123");
    expect(order.status).to.equal("pending");
    expect(order.products).to.have.lengthOf(1);
  });

  it("should be invalid if required fields are missing", async () => {
    const invalidOrder = new Orders({});

    try {
      await invalidOrder.validate();
      expect.fail("Validation should have failed");
    } catch (error) {
      expect(error.errors.name).to.exist;
      expect(error.errors.phoneNumber).to.exist;
      expect(error.errors.address).to.exist;
      expect(error.errors.pincode).to.exist;
      expect(error.errors.amount).to.exist;
      expect(error.errors.paymentId).to.exist;
      expect(error.errors.email).to.exist;
      expect(error.errors.userid).to.exist;
    }
  });

  it("should generate virtual id field", () => {
    expect(order.id).to.be.a("string");
    expect(order.toJSON()).to.have.property("id");
  });

  it("should set default status and date", () => {
    expect(order.status).to.equal("pending");
    expect(order.date).to.be.an.instanceOf(Date);
  });

  it("should allow empty products array", async () => {
    const orderWithoutProducts = new Orders({
      name: "John Doe",
      phoneNumber: "1234567890",
      address: "123 Test St",
      pincode: "12345",
      amount: "99.99",
      paymentId: "pay_123",
      email: "test@test.com",
      userid: "user123",
      products: [],
    });
    await orderWithoutProducts.validate();
  });
});
