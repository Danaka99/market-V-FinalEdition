const chai = require("chai");
const mongoose = require("mongoose");
const { Payment } = require("../../../models/payment");
require("dotenv").config({ path: "./.env.test" });
const expect = chai.expect;

describe("Payment Model", () => {
  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Payment.deleteMany({});
  });

  it("should create & save payment successfully", async () => {
    const validPayment = new Payment({
      orderId: "ORDER123",
      paymentId: "PAY123",
      amount: 1000,
      userId: "USER123",
      status: "pending",
    });
    const savedPayment = await validPayment.save();

    expect(savedPayment._id).to.exist;
    expect(savedPayment.orderId).to.equal(validPayment.orderId);
    expect(savedPayment.currency).to.equal("LKR");
    expect(savedPayment.status).to.equal("pending");
  });

  it("should fail to save payment with missing required fields", async () => {
    const paymentWithoutRequired = new Payment({
      amount: 1000,
    });

    try {
      await paymentWithoutRequired.validate();
      expect.fail("Validation should have failed");
    } catch (error) {
      expect(error).to.be.instanceOf(mongoose.Error.ValidationError);
    }
  });

  it("should fail to save duplicate orderId", async () => {
    const firstPayment = new Payment({
      orderId: "ORDER123",
      paymentId: "PAY123",
      amount: 1000,
      userId: "USER123",
    });
    await firstPayment.save();

    const duplicatePayment = new Payment({
      orderId: "ORDER123",
      paymentId: "PAY124",
      amount: 2000,
      userId: "USER124",
    });

    try {
      await duplicatePayment.save();
      expect.fail("Should not save duplicate orderId");
    } catch (error) {
      expect(error.code).to.equal(11000);
    }
  });

  it("should fail with invalid status value", async () => {
    const paymentWithInvalidStatus = new Payment({
      orderId: "ORDER123",
      paymentId: "PAY123",
      amount: 1000,
      userId: "USER123",
      status: "invalid_status",
    });

    try {
      await paymentWithInvalidStatus.validate();
      expect.fail("Validation should have failed");
    } catch (error) {
      expect(error).to.be.instanceOf(mongoose.Error.ValidationError);
      expect(error.errors.status).to.exist;
    }
  });

  it("should correctly generate virtual id field", async () => {
    const payment = new Payment({
      orderId: "ORDER123",
      paymentId: "PAY123",
      amount: 1000,
      userId: "USER123",
    });
    const savedPayment = await payment.save();

    expect(savedPayment.id).to.be.a("string");
    expect(savedPayment.id).to.equal(savedPayment._id.toHexString());
  });

  it("should save optional fields correctly", async () => {
    const paymentWithOptional = new Payment({
      orderId: "ORDER123",
      paymentId: "PAY123",
      amount: 1000,
      userId: "USER123",
      paymentMethod: "VISA",
      cardHolderName: "John Doe",
      cardNo: "4111111111111111",
    });

    const savedPayment = await paymentWithOptional.save();
    expect(savedPayment.paymentMethod).to.equal("VISA");
    expect(savedPayment.cardHolderName).to.equal("John Doe");
    expect(savedPayment.cardNo).to.equal("4111111111111111");
  });
});
