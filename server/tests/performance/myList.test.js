const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai");
const { MyList } = require("../../models/myList");
const express = require("express");
const myListRoutes = require("../../routes/myList");

require("dotenv").config({ path: "./.env.test" });

const app = express();
app.use(express.json());
app.use("/api/mylist", myListRoutes);

describe("MyList API Performance Tests", function () {
  this.timeout(60000);

  const CONFIG = {
    NUM_ITEMS: 100,
    BATCH_SIZE: 10,
    ACCEPTABLE_RESPONSE_TIME: 1000,
    MAX_RETRIES: 3,
  };

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await MyList.deleteMany({});
  });

  it("should handle bulk operations within acceptable time", async () => {
    const startAdd = Date.now();
    const items = Array(CONFIG.NUM_ITEMS)
      .fill()
      .map((_, i) => ({
        productTitle: `Test Product ${i}`,
        image: "test-image.jpg",
        rating: 4.5,
        price: 99.99,
        productId: `prod${i}`,
        userId: `user${Math.floor(i / 10)}`,
      }));

    const addPromises = items.map((item) =>
      request(app).post("/api/mylist/add").send(item)
    );

    const results = await Promise.all(addPromises);
    const addTime = Date.now() - startAdd;

    const avgAddTime = addTime / CONFIG.NUM_ITEMS;
    expect(addTime).to.be.below(CONFIG.ACCEPTABLE_RESPONSE_TIME * 10);

    // Test bulk retrieval
    const startGet = Date.now();
    const getResponse = await request(app).get("/api/mylist");
    const getTime = Date.now() - startGet;

    const avgGetTime = getTime / CONFIG.NUM_ITEMS;
    expect(getTime).to.be.below(CONFIG.ACCEPTABLE_RESPONSE_TIME);

    // Test bulk deletion
    const startDelete = Date.now();
    const deletePromises = getResponse.body.map((item) =>
      request(app).delete(`/api/mylist/${item._id}`)
    );
    await Promise.all(deletePromises);
    const deleteTime = Date.now() - startDelete;

    const avgDeleteTime = deleteTime / CONFIG.NUM_ITEMS;
    console.log(
      `Average times (ms): Add=${avgAddTime}, Get=${avgGetTime}, Delete=${avgDeleteTime}`
    );

    expect(deleteTime).to.be.below(CONFIG.ACCEPTABLE_RESPONSE_TIME * 10);
  });

  it("should maintain performance under concurrent user operations", async () => {
    const testItem = {
      productTitle: "Concurrent Test Product",
      image: "test-image.jpg",
      rating: 4.5,
      price: 99.99,
      productId: "prod_concurrent",
      userId: "user_concurrent",
    };

    const startConcurrent = Date.now();
    const concurrentPromises = Array(20)
      .fill()
      .map(() =>
        request(app)
          .post("/api/mylist/add")
          .send({
            ...testItem,
            productId: `prod_${Math.random()}`,
            userId: `user_${Math.random()}`,
          })
      );

    const results = await Promise.all(concurrentPromises);
    const concurrentTime = Date.now() - startConcurrent;

    const avgConcurrentTime = concurrentTime / 20;
    console.log(`Average time per concurrent add: ${avgConcurrentTime}ms`);
    expect(concurrentTime).to.be.below(CONFIG.ACCEPTABLE_RESPONSE_TIME * 5);
  });

  it("should handle rapid sequential read operations efficiently", async () => {
    const testItem = await new MyList({
      productTitle: "Sequential Test Product",
      image: "test-image.jpg",
      rating: 4.5,
      price: 99.99,
      productId: "prod_sequential",
      userId: "user_sequential",
    }).save();

    const startSequential = Date.now();
    for (let i = 0; i < 50; i++) {
      const res = await request(app).get(`/api/mylist/${testItem._id}`);
      expect(res.status).to.equal(200);
    }
    const sequentialTime = Date.now() - startSequential;

    const avgSequentialTime = sequentialTime / 50;
    console.log(`Average time per sequential get: ${avgSequentialTime}ms`);
    expect(sequentialTime).to.be.below(CONFIG.ACCEPTABLE_RESPONSE_TIME * 25);
  });
});
