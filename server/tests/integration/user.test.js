const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai");
const { User } = require("../../models/user");
const express = require("express");
const userRoutes = require("../../routes/user");
const bcrypt = require("bcrypt");
require("dotenv").config({ path: "./.env.test" });

const axios = require("axios");
const stream = require("stream");

const app = express();
app.use(express.json());
app.use("/api/users", userRoutes);

describe("User Routes Integration Tests", function () {
  this.timeout(10000);

  let testUser;
  let testUserPassword = "testPassword123";

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});

    const hashedPassword = await bcrypt.hash(testUserPassword, 10);
    testUser = new User({
      name: "Test User",
      phone: "1234567890",
      email: "test@test.com",
      password: hashedPassword,
      isAdmin: false,
    });
    await testUser.save();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe("POST /signup", () => {
    it("should create a new user", async () => {
      const newUser = {
        name: "New User",
        phone: "9876543210",
        email: "new@test.com",
        password: "newPassword123",
        isAdmin: false,
      };

      const res = await request(app).post("/api/users/signup").send(newUser);

      expect(res.status).to.equal(200);
      expect(res.body.user).to.have.property("name", newUser.name);
      expect(res.body).to.have.property("token");
      expect(res.body.msg).to.equal("User Register Successfully");

      const userInDb = await User.findOne({ email: newUser.email });
      expect(userInDb).to.exist;
      expect(userInDb.name).to.equal(newUser.name);
    });

    it("should not create user with existing email", async () => {
      const duplicateUser = {
        name: "Duplicate User",
        phone: "9999999999",
        email: "test@test.com",
        password: "password123",
        isAdmin: false,
      };

      const res = await request(app)
        .post("/api/users/signup")
        .send(duplicateUser);

      expect(res.body.status).to.equal("FAILED");
      expect(res.body.msg).to.equal("User already exist with this email!");
    });
  });

  describe("POST /signin", () => {
    it("should authenticate valid user", async () => {
      const credentials = {
        email: "test@test.com",
        password: testUserPassword,
      };

      const res = await request(app)
        .post("/api/users/signin")
        .send(credentials);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("token");
      expect(res.body.user.email).to.equal(credentials.email);
    });

    it("should reject invalid password", async () => {
      const credentials = {
        email: "test@test.com",
        password: "wrongpassword",
      };

      const res = await request(app)
        .post("/api/users/signin")
        .send(credentials);

      expect(res.status).to.equal(400);
      expect(res.body.error).to.be.true;
      expect(res.body.msg).to.equal("Invailid credentials");
    });
  });

  describe("PUT /changePassword/:id", () => {
    it("should change user password", async () => {
      const updateData = {
        name: "Test User",
        phone: "1234567890",
        email: "test@test.com",
        password: testUserPassword,
        newPass: "newPassword456",
      };

      const res = await request(app)
        .put(`/api/users/changePassword/${testUser.id}`)
        .send(updateData);

      expect(res.status).to.equal(200);

      const signinRes = await request(app).post("/api/users/signin").send({
        email: "test@test.com",
        password: "newPassword456",
      });

      expect(signinRes.status).to.equal(200);
    });

    it("should reject wrong current password", async () => {
      const updateData = {
        name: "Test User",
        phone: "1234567890",
        email: "test@test.com",
        password: "wrongpassword",
        newPass: "newPassword456",
      };

      const res = await request(app)
        .put(`/api/users/changePassword/${testUser.id}`)
        .send(updateData);

      expect(res.status).to.equal(404);
      expect(res.body.error).to.be.true;
      expect(res.body.msg).to.equal("current password wrong");
    });
  });

  describe("GET /", () => {
    it("should return all users", async () => {
      const res = await request(app).get("/api/users");
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(1);
      expect(res.body[0].email).to.equal(testUser.email);
    });
  });

  describe("GET /:id", () => {
    it("should return user by id", async () => {
      const res = await request(app).get(`/api/users/${testUser.id}`);
      expect(res.status).to.equal(200);
      expect(res.body.email).to.equal(testUser.email);
    });

    it("should return 500 for invalid id", async () => {
      const res = await request(app).get("/api/users/abcdef70b0456d455fa0c0af");
      expect(res.status).to.equal(500);
    });
  });

  describe("DELETE /:id", () => {
    it("should delete existing user", async () => {
      const res = await request(app).delete(`/api/users/${testUser.id}`);
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("the user is deleted!");

      const userInDb = await User.findById(testUser.id);
      expect(userInDb).to.be.null;
    });

    it("should return 404 for non-existent user", async () => {
      const res = await request(app).delete(
        "/api/users/abcdef70b0456d455fa0c0af"
      );
      expect(res.status).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("user not found!");
    });
  });

  describe("GET /get/count", () => {
    it("should return correct user count", async () => {
      const res = await request(app).get("/api/users/get/count");
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("userCount", 1);
    });
  });

  describe("PUT /:id", () => {
    it("should update user details", async () => {
      const updateData = {
        name: "Updated Name",
        phone: "5555555555",
        email: "updated@test.com",
      };

      const res = await request(app)
        .put(`/api/users/${testUser.id}`)
        .send(updateData);

      expect(res.status).to.equal(200);
      expect(res.body.name).to.equal(updateData.name);
      expect(res.body.email).to.equal(updateData.email);

      const userInDb = await User.findById(testUser.id);
      expect(userInDb.name).to.equal(updateData.name);
    });
  });

  describe("POST /upload", () => {
    it("should handle image upload", async function () {
      this.timeout(20000);

      const imageUrl =
        "https://www.google.com/images/branding/googlelogo/1x/googlelogo_dark_color_272x92dp.png";

      const imageBuffer = await axios
        .get(imageUrl, { responseType: "arraybuffer" })
        .then((response) => response.data);

      const imageStream = new stream.PassThrough();
      imageStream.end(imageBuffer);

      const res = await request(app)
        .post("/api/users/upload")
        .attach("images", imageStream, { filename: "test-image.png" });

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body.length).to.be.greaterThan(0);
    });
  });
});
