const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai");
const { HomeBanner } = require("../../models/homeBanner");
const express = require("express");
const homeBannerRoutes = require("../../routes/homeBanner");
const axios = require("axios");
const stream = require("stream");

require("dotenv").config({ path: "./.env.test" });

const app = express();
app.use(express.json());
app.use("/api/home-banners", homeBannerRoutes);

describe("HomeBanner API Performance Tests", function () {
  this.timeout(60000);

  const CONFIG = {
    TEST_IMAGE_URL: "https://picsum.photos/100/100",
    NUM_BANNERS: 3,
    RETRY_ATTEMPTS: 3,
  };

  const retryOperation = async (
    operation,
    attempts = CONFIG.RETRY_ATTEMPTS
  ) => {
    for (let i = 0; i < attempts; i++) {
      try {
        return await operation();
      } catch (err) {
        if (i === attempts - 1) throw err;
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await HomeBanner.deleteMany({});
  });

  it("should maintain performance under load for CRUD operations", async () => {
    const metrics = {
      uploadTimes: [],
      createTimes: [],
      getTimes: [],
    };

    try {
      const imageResponse = await axios.get(CONFIG.TEST_IMAGE_URL, {
        responseType: "arraybuffer",
        timeout: 5000,
      });

      for (let i = 0; i < CONFIG.NUM_BANNERS; i++) {
        const imageStream = new stream.PassThrough();
        imageStream.end(imageResponse.data);

        const uploadStart = Date.now();
        const uploadRes = await retryOperation(() =>
          request(app)
            .post("/api/home-banners/upload")
            .attach("images", imageStream, "test.jpg")
            .timeout(5000)
        );
        metrics.uploadTimes.push(Date.now() - uploadStart);

        const createStart = Date.now();
        const createRes = await retryOperation(() =>
          request(app)
            .post("/api/home-banners/create")
            .send({ images: uploadRes.body })
            .timeout(5000)
        );
        metrics.createTimes.push(Date.now() - createStart);
      }

      await Promise.all(
        Array(5)
          .fill()
          .map(async () => {
            const start = Date.now();
            const res = await request(app).get("/api/home-banners");
            metrics.getTimes.push(Date.now() - start);
            expect(res.status).to.equal(200);
          })
      );

      const avgUpload =
        metrics.uploadTimes.reduce((a, b) => a + b, 0) /
        metrics.uploadTimes.length;
      const avgCreate =
        metrics.createTimes.reduce((a, b) => a + b, 0) /
        metrics.createTimes.length;
      const avgGet =
        metrics.getTimes.reduce((a, b) => a + b, 0) / metrics.getTimes.length;

      console.log(
        `Average times (ms): Upload=${avgUpload}, Create=${avgCreate}, GET=${avgGet}`
      );

      expect(avgUpload).to.be.below(3000);
      expect(avgCreate).to.be.below(1000);
      expect(avgGet).to.be.below(500);
    } catch (error) {
      console.error("Test failed:", error.message);
      throw error;
    }
  });

  it("should maintain performance for delete operations", async () => {
    try {
      const imageResponse = await axios.get(CONFIG.TEST_IMAGE_URL, {
        responseType: "arraybuffer",
        timeout: 5000,
      });

      const bannerIds = [];
      const deleteTimes = [];

      for (let i = 0; i < CONFIG.NUM_BANNERS; i++) {
        const imageStream = new stream.PassThrough();
        imageStream.end(imageResponse.data);

        const uploadRes = await retryOperation(() =>
          request(app)
            .post("/api/home-banners/upload")
            .attach("images", imageStream, "test.jpg")
            .timeout(5000)
        );

        const createRes = await retryOperation(() =>
          request(app)
            .post("/api/home-banners/create")
            .send({ images: uploadRes.body })
            .timeout(5000)
        );

        bannerIds.push(createRes.body._id);
      }

      for (const id of bannerIds) {
        const start = Date.now();
        await retryOperation(() =>
          request(app).delete(`/api/home-banners/${id}`).timeout(5000)
        );
        deleteTimes.push(Date.now() - start);
      }

      const avgDelete =
        deleteTimes.reduce((a, b) => a + b, 0) / deleteTimes.length;
      console.log(`Average delete time (ms): ${avgDelete}`);
      expect(avgDelete).to.be.below(1000);
    } catch (error) {
      console.error("Delete test failed:", error.message);
      throw error;
    }
  });
});
