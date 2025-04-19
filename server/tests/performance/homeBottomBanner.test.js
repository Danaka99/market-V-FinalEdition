const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai");
const { HomeBottomBanners } = require("../../models/homeBottomBanner");
const express = require("express");
const homeBottomBannersRoutes = require("../../routes/homeBottomBanner");
const axios = require("axios");
const stream = require("stream");

require("dotenv").config({ path: "./.env.test" });

const app = express();
app.use(express.json());
app.use("/api/homeBottomBanners", homeBottomBannersRoutes);

describe("HomeBottomBanner API Performance Tests", function () {
  this.timeout(60000);

  const CONFIG = {
    TEST_IMAGE_URL: "https://picsum.photos/100/100",
    NUM_BANNERS: 3,
    RETRY_ATTEMPTS: 3,
    ACCEPTABLE_RESPONSE_TIME: 3000,
    BATCH_SIZE: 5,
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
    await HomeBottomBanners.deleteMany({});
  });

  it("should handle batch banner operations efficiently", async () => {
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
            .post("/api/homeBottomBanners/upload")
            .attach("images", imageStream, "test.jpg")
            .timeout(5000)
        );
        metrics.uploadTimes.push(Date.now() - uploadStart);

        const createStart = Date.now();
        await retryOperation(() =>
          request(app)
            .post("/api/homeBottomBanners/create")
            .send({
              images: uploadRes.body,
              catId: `cat${i}`,
              catName: `Category ${i}`,
              subCatId: `sub${i}`,
              subCatName: `SubCategory ${i}`,
            })
            .timeout(5000)
        );
        metrics.createTimes.push(Date.now() - createStart);
      }

      const getStart = Date.now();
      const getRes = await request(app).get("/api/homeBottomBanners");
      metrics.getTimes.push(Date.now() - getStart);

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
      expect(avgUpload).to.be.below(CONFIG.ACCEPTABLE_RESPONSE_TIME);
      expect(avgCreate).to.be.below(CONFIG.ACCEPTABLE_RESPONSE_TIME);
      expect(avgGet).to.be.below(1000);
    } catch (error) {
      console.error("Test failed:", error.message);
      throw error;
    }
  });

  it("should maintain performance for image operations", async () => {
    try {
      const imageResponse = await axios.get(CONFIG.TEST_IMAGE_URL, {
        responseType: "arraybuffer",
        timeout: 5000,
      });

      const deleteImageTimes = [];
      for (let i = 0; i < CONFIG.BATCH_SIZE; i++) {
        const start = Date.now();
        await request(app)
          .delete("/api/homeBottomBanners/deleteImage")
          .query({ img: `https://res.cloudinary.com/test/image-${i}.jpg` });
        deleteImageTimes.push(Date.now() - start);
      }

      const avgDeleteTime =
        deleteImageTimes.reduce((a, b) => a + b, 0) / deleteImageTimes.length;
      console.log(`Average image delete time: ${avgDeleteTime}ms`);
      expect(avgDeleteTime).to.be.below(CONFIG.ACCEPTABLE_RESPONSE_TIME);
    } catch (error) {
      console.error("Image operation test failed:", error.message);
      throw error;
    }
  });
});
