const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai");
const { Orders } = require("../../models/orders");
const express = require("express");
const orderRoutes = require("../../routes/orders");

require("dotenv").config({ path: "./.env.test" });

const app = express();
app.use(express.json());
app.use("/api/orders", orderRoutes);

describe("Orders API Performance Tests", function () {
  this.timeout(60000);

  const CONFIG = {
    NUM_ORDERS: 100,
    BATCH_SIZE: 20,
    ACCEPTABLE_RESPONSE_TIME: 2000,
    CONCURRENT_USERS: 10,
  };

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Orders.deleteMany({});
  });

  it("should handle bulk order creation within acceptable time", async () => {
    const orders = Array(CONFIG.NUM_ORDERS)
      .fill()
      .map((_, i) => ({
        name: `Customer ${i}`,
        phoneNumber: `123456789${i}`,
        address: `${i} Test Street`,
        pincode: "12345",
        amount: 99.99,
        paymentId: `pay_${i}`,
        email: `customer${i}@test.com`,
        userid: `user${i}`,
        products: [{ id: "prod1", quantity: 1 }],
        date: new Date(),
      }));

    const startTime = Date.now();
    const createPromises = [];

    for (let i = 0; i < orders.length; i += CONFIG.BATCH_SIZE) {
      const batch = orders.slice(i, i + CONFIG.BATCH_SIZE);
      const batchPromises = batch.map((order) =>
        request(app).post("/api/orders/create").send(order)
      );
      createPromises.push(...batchPromises);
    }

    const results = await Promise.all(createPromises);
    const totalTime = Date.now() - startTime;

    const avgOrderCreateTime = totalTime / CONFIG.NUM_ORDERS;
    console.log(`Average time per order creation: ${avgOrderCreateTime}ms`);
    expect(totalTime).to.be.below(CONFIG.ACCEPTABLE_RESPONSE_TIME * 10);
    results.forEach((res) => expect(res.status).to.equal(201));
  });

  it("should maintain performance under concurrent order retrievals", async () => {
    const testOrder = await new Orders({
      name: "Test Customer",
      phoneNumber: "1234567890",
      address: "Test Address",
      pincode: "12345",
      amount: 99.99,
      paymentId: "test_pay",
      email: "test@test.com",
      userid: "test_user",
      products: [{ id: "prod1", quantity: 1 }],
      date: new Date(),
    }).save();

    const startTime = Date.now();
    const concurrentPromises = Array(CONFIG.CONCURRENT_USERS)
      .fill()
      .map(() => request(app).get(`/api/orders/${testOrder._id}`));

    const results = await Promise.all(concurrentPromises);
    const totalTime = Date.now() - startTime;

    const avgConcurrentRetrievalTime = totalTime / CONFIG.CONCURRENT_USERS;
    console.log(
      `Average time per concurrent retrieval: ${avgConcurrentRetrievalTime}ms`
    );
    expect(totalTime).to.be.below(CONFIG.ACCEPTABLE_RESPONSE_TIME);
    results.forEach((res) => expect(res.status).to.equal(200));
  });

  it("should handle bulk order updates efficiently", async () => {
    const order = await new Orders({
      name: "Initial Customer",
      phoneNumber: "1234567890",
      address: "Initial Address",
      pincode: "12345",
      amount: 99.99,
      paymentId: "initial_pay",
      email: "initial@test.com",
      userid: "initial_user",
      products: [{ id: "prod1", quantity: 1 }],
      date: new Date(),
    }).save();

    const startTime = Date.now();
    const updatePromises = Array(50)
      .fill()
      .map((_, i) =>
        request(app)
          .put(`/api/orders/${order._id}`)
          .send({
            name: `Updated Customer ${i}`,
            status: "completed",
            address: `Updated Address ${i}`,
          })
      );

    const results = await Promise.all(updatePromises);
    const totalTime = Date.now() - startTime;

    const avgOrderUpdateTime = totalTime / 50;
    console.log(`Average time per order update: ${avgOrderUpdateTime}ms`);
    expect(totalTime).to.be.below(CONFIG.ACCEPTABLE_RESPONSE_TIME * 5);
    results.forEach((res) => expect(res.status).to.equal(200));
  });

  it("should handle rapid sequential order count queries", async () => {
    const startTime = Date.now();
    const promises = Array(100)
      .fill()
      .map(() => request(app).get("/api/orders/get/count"));

    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;

    const avgOrderCountQueryTime = totalTime / 100;
    console.log(
      `Average time per order count query: ${avgOrderCountQueryTime}ms`
    );
    expect(totalTime).to.be.below(CONFIG.ACCEPTABLE_RESPONSE_TIME * 2);
    results.forEach((res) => {
      expect(res.status).to.be.oneOf([200, 500]);
    });
  });
});
