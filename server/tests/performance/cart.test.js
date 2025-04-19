const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai");
const { Cart } = require("../../models/cart");
const express = require("express");
const cartRoutes = require("../../routes/cart");

require("dotenv").config({ path: "./.env.test" });

const app = express();
app.use(express.json());
app.use("/api/cart", cartRoutes);

describe("Cart API Performance Tests", function () {
  this.timeout(60000);

  const NUM_ITEMS = 50;
  const BATCH_SIZE = 10;
  const ACCEPTABLE_RESPONSE_TIME = 10000;

  const processBatch = async (items, operation) => {
    const results = [];
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(operation));
      results.push(...batchResults);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return results;
  };

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Cart.deleteMany({});
  });

  it("should handle bulk cart operations within acceptable time", async () => {
    const testItems = Array(NUM_ITEMS)
      .fill()
      .map((_, index) => ({
        productTitle: `Test Product ${index}`,
        image: "test.jpg",
        rating: 4.5,
        price: 100,
        quantity: 1,
        subTotal: 100,
        productId: `prod${index}`,
        userId: `user${index}`,
        countInStock: 20,
      }));

    const startAdd = Date.now();
    const addedItems = await processBatch(testItems, (item) =>
      request(app).post("/api/cart/add").send(item)
    );
    const addTime = Date.now() - startAdd;
    expect(addTime).to.be.below(ACCEPTABLE_RESPONSE_TIME);

    const startGet = Date.now();
    const getResponse = await request(app).get("/api/cart");
    const getTime = Date.now() - startGet;
    expect(getTime).to.be.below(ACCEPTABLE_RESPONSE_TIME);

    const startUpdate = Date.now();
    await processBatch(getResponse.body, (item) =>
      request(app)
        .put(`/api/cart/${item._id}`)
        .send({ ...item, quantity: 2, subTotal: item.price * 2 })
    );
    const updateTime = Date.now() - startUpdate;
    expect(updateTime).to.be.below(ACCEPTABLE_RESPONSE_TIME);

    const startDelete = Date.now();
    await processBatch(getResponse.body, (item) =>
      request(app).delete(`/api/cart/${item._id}`)
    );
    const deleteTime = Date.now() - startDelete;
    console.log(
      `Average times (ms): Add=${addTime}, Get=${getTime}, Update=${updateTime}, Delete=${deleteTime}`
    );

    expect(deleteTime).to.be.below(ACCEPTABLE_RESPONSE_TIME);
  });

  it("should handle rapid sequential requests efficiently", async () => {
    const testItem = await request(app).post("/api/cart/add").send({
      productTitle: "Sequential Test Product",
      image: "test.jpg",
      rating: 4.5,
      price: 100,
      quantity: 1,
      subTotal: 100,
      productId: "prod_sequential",
      userId: "user_sequential",
      countInStock: 20,
    });

    const itemId = testItem.body._id;

    const startSequential = Date.now();
    const requests = Array(25)
      .fill()
      .map(() => request(app).get(`/api/cart/${itemId}`));

    await Promise.all(requests);
    const sequentialTime = Date.now() - startSequential;
    console.log(`Sequential requests time: ${sequentialTime}ms`);
    expect(sequentialTime).to.be.below(ACCEPTABLE_RESPONSE_TIME);
  });
});
