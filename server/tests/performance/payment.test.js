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

describe("Payment API Performance Tests", function () {
  this.timeout(60000);

  const CONFIG = {
    NUM_PAYMENTS: 50,
    BATCH_SIZE: 10,
    ACCEPTABLE_RESPONSE_TIME: 2000,
    CONCURRENT_REQUESTS: 25,
    RETRY_ATTEMPTS: 3,
  };

  const generateTestHash = (params) => {
    const hashString = `${params.merchantId}${params.orderId}${params.amount}${params.currency}test_merchant_secret`;
    return require("crypto")
      .createHash("md5")
      .update(hashString)
      .digest("hex")
      .toUpperCase();
  };

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

  it("should handle concurrent hash generation requests", async () => {
    const startTime = Date.now();
    const hashRequests = Array(CONFIG.CONCURRENT_REQUESTS)
      .fill()
      .map((_, i) => {
        return request(app)
          .post("/api/payment/get-hash")
          .send({
            merchantId: "test_merchant",
            orderId: `order_${i}`,
            amount: 100.5,
            currency: "LKR",
          });
      });

    const results = await Promise.all(hashRequests);
    const totalTime = Date.now() - startTime;

    console.log(
      `Hash generation time: ${totalTime}ms for ${CONFIG.CONCURRENT_REQUESTS} requests`
    );
    expect(totalTime).to.be.below(CONFIG.ACCEPTABLE_RESPONSE_TIME);
    results.forEach((res) => {
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body).to.have.property("hash");
    });
  });

  it("should handle bulk payment notifications efficiently", async () => {
    const notifications = Array(CONFIG.NUM_PAYMENTS)
      .fill()
      .map((_, i) => ({
        merchant_id: "test_merchant",
        order_id: `order_${i}`,
        payment_id: `pay_${i}`,
        payhere_amount: "100.50",
        payhere_currency: "LKR",
        status_code: "2",
        custom_1: "user123",
        method: "TEST",
        status_message: "Success",
        card_holder_name: "Test User",
        card_no: "************1234",
        card_expiry: "12/25",
        md5sig: "",
      }));

    const startTime = Date.now();
    const notifyRequests = notifications.map((notify) => {
      const md5MerchantSecret = crypto
        .createHash("md5")
        .update(process.env.PAYHERE_MERCHANT_SECRET)
        .digest("hex")
        .toUpperCase();

      const hash = crypto
        .createHash("md5")
        .update(
          notify.merchant_id +
            notify.order_id +
            notify.payhere_amount +
            notify.payhere_currency +
            notify.status_code +
            md5MerchantSecret
        )
        .digest("hex")
        .toUpperCase();

      notify.md5sig = hash;

      return request(app).post("/api/payment/notify").send(notify);
    });

    console.log("Processing notifications in batches...");
    const results = [];
    for (let i = 0; i < notifications.length; i += CONFIG.BATCH_SIZE) {
      const batch = notifyRequests.slice(i, i + CONFIG.BATCH_SIZE);
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const totalTime = Date.now() - startTime;
    console.log(
      `Notification processing time: ${totalTime}ms for ${CONFIG.NUM_PAYMENTS} notifications`
    );

    expect(totalTime).to.be.below(CONFIG.ACCEPTABLE_RESPONSE_TIME * 5);
    results.forEach((res) => {
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success", true);
    });
  });

  it("should maintain performance under mixed operations", async () => {
    const operations = [];
    const metrics = {
      hashTimes: [],
      notifyTimes: [],
    };

    for (let i = 0; i < CONFIG.BATCH_SIZE; i++) {
      const params = {
        merchantId: "test_merchant",
        orderId: `mixed_${i}`,
        amount: 100.5,
        currency: "LKR",
      };

      operations.push(
        (async () => {
          const start = Date.now();
          await request(app).post("/api/payment/get-hash").send(params);
          metrics.hashTimes.push(Date.now() - start);
        })(),
        (async () => {
          const start = Date.now();
          const hash = generateTestHash(params);
          await request(app)
            .post("/api/payment/notify")
            .send({ ...params, paymentId: `pay_${i}`, status: "2", hash });
          metrics.notifyTimes.push(Date.now() - start);
        })()
      );
    }

    await Promise.all(operations);

    const avgHashTime =
      metrics.hashTimes.reduce((a, b) => a + b, 0) / metrics.hashTimes.length;
    const avgNotifyTime =
      metrics.notifyTimes.reduce((a, b) => a + b, 0) /
      metrics.notifyTimes.length;

    console.log(
      `Average times - Hash: ${avgHashTime}ms, Notify: ${avgNotifyTime}ms`
    );
    expect(avgHashTime).to.be.below(CONFIG.ACCEPTABLE_RESPONSE_TIME);
    expect(avgNotifyTime).to.be.below(CONFIG.ACCEPTABLE_RESPONSE_TIME);
  });
});
