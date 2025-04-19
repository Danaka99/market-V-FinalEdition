const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai");
const express = require("express");
const bannerRoutes = require("../../routes/banners");
const axios = require("axios");
const stream = require("stream");
require("dotenv").config({ path: "./.env.test" });

const app = express();
app.use(express.json());
app.use("/api/banners", bannerRoutes);

describe("Banner API Performance Tests", function () {
  this.timeout(60000);

  const TEST_IMAGE_URL = "https://picsum.photos/100/100";
  const NUM_BANNERS = 3;
  const RETRY_ATTEMPTS = 3;

  const retryOperation = async (operation, attempts = RETRY_ATTEMPTS) => {
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
    await mongoose.connection.collections.banners?.drop().catch(() => {});
  });

  it("should maintain performance under load for CRUD operations", async () => {
    const metrics = {
      uploadTimes: [],
      createTimes: [],
      getTimes: [],
    };

    try {
      const imageResponse = await axios.get(TEST_IMAGE_URL, {
        responseType: "arraybuffer",
        timeout: 10000,
      });

      for (let i = 0; i < NUM_BANNERS; i++) {
        const imageStream = new stream.PassThrough();
        imageStream.end(imageResponse.data);

        const uploadStart = Date.now();
        const uploadRes = await retryOperation(() =>
          request(app)
            .post("/api/banners/upload")
            .attach("images", imageStream, "test.jpg")
            .timeout(10000)
        );
        metrics.uploadTimes.push(Date.now() - uploadStart);
        expect(uploadRes.status).to.equal(200);

        const createStart = Date.now();
        const createRes = await retryOperation(() =>
          request(app)
            .post("/api/banners/create")
            .send({
              images: uploadRes.body,
              catId: `cat${i}`,
              catName: `Category ${i}`,
              subCatId: `sub${i}`,
              subCatName: `SubCategory ${i}`,
            })
            .timeout(10000)
        );
        metrics.createTimes.push(Date.now() - createStart);
        expect(createRes.status).to.equal(201);
      }

      await Promise.all(
        Array(5)
          .fill()
          .map(async () => {
            const start = Date.now();
            const res = await request(app).get("/api/banners");
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

      expect(avgUpload).to.be.below(3000, "Upload time exceeded threshold");
      expect(avgCreate).to.be.below(1000, "Create time exceeded threshold");
      expect(avgGet).to.be.below(500, "GET time exceeded threshold");
    } catch (error) {
      console.error("Test failed:", error.message);
      throw error;
    }
  });

  it("should maintain performance for update operations", async () => {
    try {
      const imageResponse = await axios.get(TEST_IMAGE_URL, {
        responseType: "arraybuffer",
        timeout: 10000,
      });

      const imageStream = new stream.PassThrough();
      imageStream.end(imageResponse.data);

      const uploadRes = await retryOperation(() =>
        request(app)
          .post("/api/banners/upload")
          .attach("images", imageStream, "test.jpg")
          .timeout(10000)
      );

      const banner = await retryOperation(() =>
        request(app)
          .post("/api/banners/create")
          .send({
            images: uploadRes.body,
            catId: "testCat",
            catName: "Test Category",
          })
          .timeout(10000)
      );

      const updateTimes = [];
      const numUpdates = 5;

      for (let i = 0; i < numUpdates; i++) {
        const start = Date.now();
        await retryOperation(() =>
          request(app)
            .put(`/api/banners/${banner.body.id}`)
            .send({
              images: uploadRes.body,
              catName: `Updated Category ${i}`,
            })
            .timeout(10000)
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

  it("should maintain performance for delete operations", async () => {
    try {
      const imageResponse = await axios.get(TEST_IMAGE_URL, {
        responseType: "arraybuffer",
        timeout: 10000,
      });

      const bannerIds = [];
      const deleteTimes = [];

      for (let i = 0; i < NUM_BANNERS; i++) {
        const imageStream = new stream.PassThrough();
        imageStream.end(imageResponse.data);

        const uploadRes = await retryOperation(() =>
          request(app)
            .post("/api/banners/upload")
            .attach("images", imageStream, "test.jpg")
            .timeout(10000)
        );

        const createRes = await retryOperation(() =>
          request(app)
            .post("/api/banners/create")
            .send({
              images: uploadRes.body,
              catId: `cat${i}`,
              catName: `Category ${i}`,
            })
            .timeout(10000)
        );

        bannerIds.push(createRes.body.id);
      }

      for (const id of bannerIds) {
        const start = Date.now();
        await retryOperation(() =>
          request(app).delete(`/api/banners/${id}`).timeout(10000)
        );
        deleteTimes.push(Date.now() - start);
      }

      const avgDelete =
        deleteTimes.reduce((a, b) => a + b, 0) / deleteTimes.length;
      console.log(`Average delete time (ms): ${avgDelete}`);
      expect(avgDelete).to.be.below(1000, "Delete time exceeded threshold");
    } catch (error) {
      console.error("Delete test failed:", error.message);
      throw error;
    }
  });

  it("should maintain performance for image deletion", async () => {
    try {
      const imageResponse = await axios.get(TEST_IMAGE_URL, {
        responseType: "arraybuffer",
        timeout: 10000,
      });

      const imageStream = new stream.PassThrough();
      imageStream.end(imageResponse.data);

      const uploadRes = await retryOperation(() =>
        request(app)
          .post("/api/banners/upload")
          .attach("images", imageStream, "test.jpg")
          .timeout(10000)
      );

      const start = Date.now();
      await retryOperation(() =>
        request(app)
          .delete("/api/banners/deleteImage")
          .query({ img: uploadRes.body[0] })
          .timeout(10000)
      );
      const deleteTime = Date.now() - start;

      console.log(`Image deletion time (ms): ${deleteTime}`);
      expect(deleteTime).to.be.below(
        2000,
        "Image deletion time exceeded threshold"
      );
    } catch (error) {
      console.error("Image deletion test failed:", error.message);
      throw error;
    }
  });
});
