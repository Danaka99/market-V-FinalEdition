const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai");
const { Payment } = require("../../models/payment");
const express = require("express");
const paymentRoutes = require("../../routes/payment");
const crypto = require("crypto");
require("dotenv").config({ path: "./.env.test" });

const app = express();
app.use(express.json());
app.use("/api/payment", paymentRoutes);

describe("Payment Routes Integration Tests", function () {
  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
    process.env.PAYHERE_MERCHANT_SECRET = "test_merchant_secret";
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Payment.deleteMany({});
  });

  afterEach(async () => {
    await Payment.deleteMany({});
  });

  describe("POST /get-hash", () => {
    it("should generate correct payment hash", async function () {
      const paymentData = {
        merchantId: "test_merchant",
        orderId: "order123",
        amount: 100.5,
        currency: "LKR",
      };

      const res = await request(app)
        .post("/api/payment/get-hash")
        .send(paymentData);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body).to.have.property("hash");

      const md5MerchantSecret = crypto
        .createHash("md5")
        .update("test_merchant_secret")
        .digest("hex")
        .toUpperCase();

      const expectedHash = crypto
        .createHash("md5")
        .update(
          `${paymentData.merchantId}${paymentData.orderId}${Number(
            paymentData.amount
          ).toFixed(2)}${paymentData.currency}${md5MerchantSecret}`
        )
        .digest("hex")
        .toUpperCase();

      expect(res.body.hash).to.equal(expectedHash);
    });

    it("should return error for missing fields", async function () {
      const paymentData = {
        merchantId: "test_merchant",
        currency: "LKR",
      };

      const res = await request(app)
        .post("/api/payment/get-hash")
        .send(paymentData);

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.include("Missing required fields");
      expect(res.body.error).to.include("orderId");
      expect(res.body.error).to.include("amount");
    });

    it("should use LKR as default currency", async function () {
      const paymentData = {
        merchantId: "test_merchant",
        orderId: "order123",
        amount: 100.5,
      };

      const res = await request(app)
        .post("/api/payment/get-hash")
        .send(paymentData);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body).to.have.property("hash");
    });
  });

  describe("POST /notify", () => {
    it("should process successful payment notification", async function () {
      const merchantSecret = "test_merchant_secret";
      const notificationData = {
        merchant_id: "test_merchant",
        order_id: "order123",
        payment_id: "pay123",
        payhere_amount: "100.50",
        payhere_currency: "LKR",
        status_code: "2",
        custom_1: "user123",
        method: "VISA",
        card_holder_name: "John Doe",
        card_no: "************1234",
      };

      const md5MerchantSecret = crypto
        .createHash("md5")
        .update(merchantSecret)
        .digest("hex")
        .toUpperCase();

      notificationData.md5sig = crypto
        .createHash("md5")
        .update(
          notificationData.merchant_id +
            notificationData.order_id +
            notificationData.payhere_amount +
            notificationData.payhere_currency +
            notificationData.status_code +
            md5MerchantSecret
        )
        .digest("hex")
        .toUpperCase();

      const res = await request(app)
        .post("/api/payment/notify")
        .send(notificationData);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;

      const payment = await Payment.findOne({
        orderId: notificationData.order_id,
      });
      expect(payment).to.exist;
      expect(payment.status).to.equal("success");
      expect(payment.amount).to.equal(
        parseFloat(notificationData.payhere_amount)
      );
      expect(payment.userId).to.equal(notificationData.custom_1);
      expect(payment.paymentMethod).to.equal(notificationData.method);
    });

    it("should reject notification with invalid hash", async function () {
      const notificationData = {
        merchant_id: "test_merchant",
        order_id: "order123",
        payhere_amount: "100.50",
        payhere_currency: "LKR",
        status_code: "2",
        md5sig: "invalid_hash",
      };

      const res = await request(app)
        .post("/api/payment/notify")
        .send(notificationData);

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal("Invalid hash");
    });

    it("should handle different payment status codes", async function () {
      const statusTests = [
        { code: "0", expectedStatus: "pending" },
        { code: "-1", expectedStatus: "cancelled" },
        { code: "-2", expectedStatus: "failed" },
        { code: "-3", expectedStatus: "chargedback" },
      ];

      for (const test of statusTests) {
        const merchantSecret = "test_merchant_secret";
        const notificationData = {
          merchant_id: "test_merchant",
          order_id: `order_${test.code}`,
          payment_id: `pay_${test.code}`,
          payhere_amount: "100.50",
          payhere_currency: "LKR",
          status_code: test.code,
          custom_1: "user123",
        };

        const md5MerchantSecret = crypto
          .createHash("md5")
          .update(merchantSecret)
          .digest("hex")
          .toUpperCase();

        notificationData.md5sig = crypto
          .createHash("md5")
          .update(
            notificationData.merchant_id +
              notificationData.order_id +
              notificationData.payhere_amount +
              notificationData.payhere_currency +
              notificationData.status_code +
              md5MerchantSecret
          )
          .digest("hex")
          .toUpperCase();

        const res = await request(app)
          .post("/api/payment/notify")
          .send(notificationData);

        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;

        const payment = await Payment.findOne({
          orderId: notificationData.order_id,
        });
        expect(payment).to.exist;
        expect(payment.status).to.equal(test.expectedStatus);
      }
    });
  });
});
