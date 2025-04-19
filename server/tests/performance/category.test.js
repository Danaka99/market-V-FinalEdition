const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai");
const { Category } = require("../../models/category");
const express = require("express");
const categoryRoutes = require("../../routes/categories");
const axios = require("axios");
require("dotenv").config({ path: "./.env.test" });

const app = express();
app.use(express.json());
app.use("/api/category", categoryRoutes);

describe("Category API Performance Tests", function () {
  this.timeout(60000);

  const CONFIG = {
    WARM_UP_REQUESTS: 3,
    ACCEPTABLE_RESPONSE_TIME: 3000,
    MAX_RETRIES: 3,
    TEST_IMAGE_URL: "https://picsum.photos/100/100",
    BATCH_SIZE: 5,
  };

  before(async () => {
    try {
      await mongoose.connect(process.env.CONNECTION_STRING);
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
    }
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Category.deleteMany({});
  });

  it("should warmup the database connection", async () => {
    const warmupPromises = Array(CONFIG.WARM_UP_REQUESTS)
      .fill()
      .map((_, i) =>
        request(app)
          .post("/api/category/create")
          .send({
            name: `Warmup Category ${i}`,
            color: "#000000",
          })
      );

    await Promise.all(warmupPromises);
  });

  it("should handle hierarchical category operations efficiently", async () => {
    const startTime = Date.now();
    const categories = [];

    for (let i = 0; i < 5; i++) {
      const parent = await request(app)
        .post("/api/category/create")
        .send({
          name: `Parent ${i}`,
          color: "#FF0000",
        });
      categories.push(parent.body);

      for (let j = 0; j < 3; j++) {
        await request(app)
          .post("/api/category/create")
          .send({
            name: `Child ${i}-${j}`,
            parentId: parent.body._id,
            color: "#00FF00",
          });
      }
    }

    const getStart = Date.now();
    const response = await request(app).get("/api/category");
    const queryTime = Date.now() - getStart;

    console.log(`Hierarchical query time: ${queryTime}ms`);
    expect(queryTime).to.be.below(CONFIG.ACCEPTABLE_RESPONSE_TIME);
  });

  it("should maintain performance under concurrent updates", async () => {
    const category = await request(app).post("/api/category/create").send({
      name: "Test Category",
      color: "#FF0000",
    });

    const updateTimes = [];
    const concurrentUpdates = Array(10)
      .fill()
      .map(async (_, index) => {
        const start = Date.now();
        await request(app)
          .put(`/api/category/${category.body._id}`)
          .send({
            name: `Updated Category ${index}`,
            color: "#00FF00",
          });
        updateTimes.push(Date.now() - start);
      });

    await Promise.all(concurrentUpdates);
    const avgUpdateTime =
      updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;

    console.log(`Average update time: ${avgUpdateTime}ms`);
    expect(avgUpdateTime).to.be.below(CONFIG.ACCEPTABLE_RESPONSE_TIME);
  });

  it("should handle image upload operations efficiently", async () => {
    const imageResponse = await axios.get(CONFIG.TEST_IMAGE_URL, {
      responseType: "arraybuffer",
    });

    const uploadTimes = [];
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      await request(app)
        .post("/api/category/upload")
        .attach("images", Buffer.from(imageResponse.data), "test.jpg");
      uploadTimes.push(Date.now() - start);
    }

    const avgUploadTime =
      uploadTimes.reduce((a, b) => a + b, 0) / uploadTimes.length;
    console.log(`Average image upload time: ${avgUploadTime}ms`);
    expect(avgUploadTime).to.be.below(CONFIG.ACCEPTABLE_RESPONSE_TIME);
  });

  it("should maintain performance during batch deletes", async () => {
    // Create test categories
    const categories = [];
    for (let i = 0; i < 10; i++) {
      const cat = await request(app)
        .post("/api/category/create")
        .send({
          name: `Delete Test ${i}`,
          color: "#FF0000",
        });
      categories.push(cat.body);
    }

    const deleteTimes = [];
    for (const category of categories) {
      const start = Date.now();
      await request(app).delete(`/api/category/${category._id}`);
      deleteTimes.push(Date.now() - start);
    }

    const avgDeleteTime =
      deleteTimes.reduce((a, b) => a + b, 0) / deleteTimes.length;
    console.log(`Average delete time: ${avgDeleteTime}ms`);
    expect(avgDeleteTime).to.be.below(CONFIG.ACCEPTABLE_RESPONSE_TIME);
  });
});
