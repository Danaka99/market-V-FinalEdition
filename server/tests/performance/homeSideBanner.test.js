const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai");
const { HomeSideBanners } = require("../../models/homeSideBanner");
const express = require("express");
const homeSideBannerRoutes = require("../../routes/homeSideBanner");
const axios = require("axios");
const stream = require("stream");
const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: "./.env.test" });

const app = express();
app.use(express.json());
app.use("/api/homeSideBanners", homeSideBannerRoutes);

const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

describe("HomeSideBanner API Performance Tests", function () {
  this.timeout(60000);

  const CONFIG = {
    TEST_IMAGE_URL: "https://picsum.photos/100/100",
    NUM_CONCURRENT: 3,
    RETRY_ATTEMPTS: 3,
    REQUEST_TIMEOUT: 15000,
    ACCEPTABLE_UPLOAD_TIME: 3000,
    ACCEPTABLE_CREATE_TIME: 1500,
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
    await HomeSideBanners.deleteMany({});
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
        timeout: CONFIG.REQUEST_TIMEOUT,
      });

      for (let i = 0; i < CONFIG.NUM_CONCURRENT; i++) {
        const imageStream = new stream.PassThrough();
        imageStream.end(imageResponse.data);

        const uploadStart = Date.now();
        const uploadRes = await retryOperation(() =>
          request(app)
            .post("/api/homeSideBanners/upload")
            .attach("images", imageStream, "test.jpg")
            .timeout(CONFIG.REQUEST_TIMEOUT)
        );
        metrics.uploadTimes.push(Date.now() - uploadStart);
        expect(uploadRes.status).to.equal(200);

        const createStart = Date.now();
        const createRes = await retryOperation(() =>
          request(app)
            .post("/api/homeSideBanners/create")
            .send({
              images: uploadRes.body,
              catId: `cat${i}`,
              catName: `Category ${i}`,
            })
            .timeout(CONFIG.REQUEST_TIMEOUT)
        );
        metrics.createTimes.push(Date.now() - createStart);
        expect(createRes.status).to.equal(201);
      }

      await Promise.all(
        Array(5)
          .fill()
          .map(async () => {
            const start = Date.now();
            const res = await request(app).get("/api/homeSideBanners");
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
      expect(avgUpload).to.be.below(
        CONFIG.ACCEPTABLE_UPLOAD_TIME,
        "Upload time exceeded threshold"
      );
      expect(avgCreate).to.be.below(
        CONFIG.ACCEPTABLE_CREATE_TIME,
        "Create time exceeded threshold"
      );
      expect(avgGet).to.be.below(500, "GET time exceeded threshold");
    } catch (error) {
      console.error("Test failed:", error.message);
      throw error;
    }
  });

  it("should maintain performance for update operations", async () => {
    try {
      const imageResponse = await axios.get(CONFIG.TEST_IMAGE_URL, {
        responseType: "arraybuffer",
        timeout: CONFIG.REQUEST_TIMEOUT,
      });

      const imageStream = new stream.PassThrough();
      imageStream.end(imageResponse.data);

      const uploadRes = await retryOperation(() =>
        request(app)
          .post("/api/homeSideBanners/upload")
          .attach("images", imageStream, "test.jpg")
          .timeout(CONFIG.REQUEST_TIMEOUT)
      );

      const banner = await retryOperation(() =>
        request(app)
          .post("/api/homeSideBanners/create")
          .send({
            images: uploadRes.body,
            catId: "testCat",
            catName: "Test Category",
          })
          .timeout(CONFIG.REQUEST_TIMEOUT)
      );

      const updateTimes = [];
      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await retryOperation(() =>
          request(app)
            .put(`/api/homeSideBanners/${banner.body._id}`)
            .send({
              images: uploadRes.body,
              catName: `Updated Category ${i}`,
            })
            .timeout(CONFIG.REQUEST_TIMEOUT)
        );
        updateTimes.push(Date.now() - start);
      }

      const avgUpdate =
        updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;
      console.log(`Average update time (ms): ${avgUpdate}`);
      expect(avgUpdate).to.be.below(1000, "Update time exceeded threshold");
    } catch (error) {
      console.error("Update test failed:", error.message);
      throw error;
    }
  });

  it("should handle concurrent banner operations efficiently", async () => {
    try {
      const imageResponse = await axios.get(CONFIG.TEST_IMAGE_URL, {
        responseType: "arraybuffer",
        timeout: CONFIG.REQUEST_TIMEOUT,
      });

      const metrics = {
        uploadTimes: [],
        createTimes: [],
      };

      const operations = Array(CONFIG.NUM_CONCURRENT)
        .fill()
        .map(async (_, index) => {
          const imageStream = new stream.PassThrough();
          imageStream.end(imageResponse.data);

          const uploadStart = Date.now();
          const uploadRes = await retryOperation(() =>
            request(app)
              .post("/api/homeSideBanners/upload")
              .attach("images", imageStream, `test${index}.jpg`)
              .timeout(CONFIG.REQUEST_TIMEOUT)
          );
          metrics.uploadTimes.push(Date.now() - uploadStart);

          const createStart = Date.now();
          await retryOperation(() =>
            request(app)
              .post("/api/homeSideBanners/create")
              .send({
                images: uploadRes.body,
                catId: `concurrent${index}`,
                catName: `Concurrent Category ${index}`,
              })
              .timeout(CONFIG.REQUEST_TIMEOUT)
          );
          metrics.createTimes.push(Date.now() - createStart);
        });

      await Promise.all(operations);

      const avgUpload =
        metrics.uploadTimes.reduce((a, b) => a + b, 0) /
        metrics.uploadTimes.length;
      const avgCreate =
        metrics.createTimes.reduce((a, b) => a + b, 0) /
        metrics.createTimes.length;

      console.log(
        `Average times (ms): Upload=${avgUpload} Create=${avgCreate}ms`
      );

      expect(avgUpload).to.be.below(
        CONFIG.ACCEPTABLE_UPLOAD_TIME,
        "Upload time exceeded threshold"
      );
      expect(avgCreate).to.be.below(
        CONFIG.ACCEPTABLE_CREATE_TIME,
        "Create time exceeded threshold"
      );
    } catch (error) {
      console.error("Concurrent operations test failed:", error.message);
      throw error;
    }
  });
});
