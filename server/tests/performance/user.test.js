const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai");
const { User } = require("../../models/user");
const express = require("express");
const userRoutes = require("../../routes/user");

require("dotenv").config({ path: "./.env.test" });

const app = express();
app.use(express.json());
app.use("/api/users", userRoutes);

describe("User API Performance Tests", function () {
  this.timeout(60000);

  const TEST_CONFIG = {
    NUM_USERS: 100,
    BATCH_SIZE: 20,
    RESPONSE_TIME_THRESHOLD: 2000,
    CONCURRENT_REQUESTS: 50,
  };

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
    await User.deleteMany({});
  });

  after(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  it("should handle bulk user registration efficiently", async () => {
    const users = Array(TEST_CONFIG.NUM_USERS)
      .fill()
      .map((_, i) => ({
        name: `Test User ${i}`,
        phone: `123456789${i}`,
        email: `test${i}@test.com`,
        password: "testPassword123",
        isAdmin: false,
      }));

    const startTime = Date.now();

    for (let i = 0; i < users.length; i += TEST_CONFIG.BATCH_SIZE) {
      const batch = users.slice(i, i + TEST_CONFIG.BATCH_SIZE);
      const promises = batch.map((user) =>
        request(app).post("/api/users/signup").send(user)
      );
      const results = await Promise.all(promises);

      results.forEach((res) => {
        expect(res.status).to.be.oneOf([200]);
        if (res.status === 200) {
          expect(res.body).to.have.property("token");
          expect(res.body.msg).to.equal("User Register Successfully");
        }
      });
    }

    const endTime = Date.now();
    const avgTimePerRequest = (endTime - startTime) / TEST_CONFIG.NUM_USERS;

    console.log(`Average time per user registration: ${avgTimePerRequest}ms`);
    expect(avgTimePerRequest).to.be.below(TEST_CONFIG.RESPONSE_TIME_THRESHOLD);
  });

  it("should handle concurrent authentication requests efficiently", async () => {
    const credentials = {
      email: "test0@test.com",
      password: "testPassword123",
    };

    const startTime = Date.now();

    const promises = Array(TEST_CONFIG.CONCURRENT_REQUESTS)
      .fill()
      .map(() => request(app).post("/api/users/signin").send(credentials));

    const results = await Promise.all(promises);
    const endTime = Date.now();

    results.forEach((res) => {
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("token");
    });

    const avgTimePerRequest =
      (endTime - startTime) / TEST_CONFIG.CONCURRENT_REQUESTS;
    console.log(
      `Average time per authentication request: ${avgTimePerRequest}ms`
    );
    expect(avgTimePerRequest).to.be.below(TEST_CONFIG.RESPONSE_TIME_THRESHOLD);
  });

  it("should maintain performance under concurrent user lookups", async () => {
    const startTime = Date.now();

    const promises = Array(TEST_CONFIG.CONCURRENT_REQUESTS)
      .fill()
      .map(() => request(app).get("/api/users"));

    const results = await Promise.all(promises);
    const endTime = Date.now();

    results.forEach((res) => {
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body.length).to.equal(TEST_CONFIG.NUM_USERS);
    });

    const avgTimePerRequest =
      (endTime - startTime) / TEST_CONFIG.CONCURRENT_REQUESTS;
    console.log(`Average time per user list request: ${avgTimePerRequest}ms`);
    expect(avgTimePerRequest).to.be.below(TEST_CONFIG.RESPONSE_TIME_THRESHOLD);
  });

  it("should handle concurrent password changes efficiently", async () => {
    const users = await User.find().limit(TEST_CONFIG.CONCURRENT_REQUESTS);
    const startTime = Date.now();

    const promises = users.map((user) =>
      request(app).put(`/api/users/changePassword/${user._id}`).send({
        name: user.name,
        phone: user.phone,
        email: user.email,
        password: "testPassword123",
        newPass: "newTestPassword456",
      })
    );

    const results = await Promise.all(promises);
    const endTime = Date.now();

    results.forEach((res) => {
      expect(res.status).to.equal(200);
    });

    const avgTimePerRequest = (endTime - startTime) / users.length;
    console.log(`Average time per password change: ${avgTimePerRequest}ms`);
    expect(avgTimePerRequest).to.be.below(TEST_CONFIG.RESPONSE_TIME_THRESHOLD);
  });

  it("should maintain performance under mixed read/write operations", async () => {
    const operations = [];
    const startTime = Date.now();

    // Mix of different operations
    for (let i = 0; i < TEST_CONFIG.CONCURRENT_REQUESTS; i++) {
      if (i % 3 === 0) {
        operations.push(request(app).get("/api/users"));
      } else if (i % 3 === 1) {
        operations.push(
          request(app).post("/api/users/signin").send({
            email: "test0@test.com",
            password: "newTestPassword456",
          })
        );
      } else {
        operations.push(
          request(app)
            .post("/api/users/signup")
            .send({
              name: `Mixed User ${i}`,
              phone: `987654321${i}`,
              email: `mixed${i}@test.com`,
              password: "mixedPassword123",
              isAdmin: false,
            })
        );
      }
    }

    const results = await Promise.all(operations);
    const endTime = Date.now();

    results.forEach((res) => {
      expect(res.status).to.be.oneOf([200, 201]);
    });

    const avgTimePerOperation = (endTime - startTime) / operations.length;
    console.log(`Average time per mixed operation: ${avgTimePerOperation}ms`);
    expect(avgTimePerOperation).to.be.below(
      TEST_CONFIG.RESPONSE_TIME_THRESHOLD
    );
  });
});
