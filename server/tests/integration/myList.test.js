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

describe("MyList Routes Integration Tests", function () {
  let testItem;

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await MyList.deleteMany({});

    testItem = new MyList({
      productTitle: "Test Product",
      image: "test-image.jpg",
      rating: 4.5,
      price: 99.99,
      productId: "123",
      userId: "user123",
    });
    await testItem.save();
  });

  afterEach(async () => {
    await MyList.deleteMany({});
  });

  describe("GET /", () => {
    it("should return all items in mylist", async function () {
      const res = await request(app).get("/api/mylist");
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(1);
      expect(res.body[0]).to.have.property("productTitle", "Test Product");
    });

    it("should handle query parameters", async function () {
      const res = await request(app)
        .get("/api/mylist")
        .query({ userId: "user123" });
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body[0].userId).to.equal("user123");
    });

    it("should handle empty list", async function () {
      await MyList.deleteMany({});
      const res = await request(app).get("/api/mylist");
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(0);
    });
  });

  describe("GET /:id", () => {
    it("should return item by id", async function () {
      const res = await request(app).get(`/api/mylist/${testItem.id}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("productTitle", "Test Product");
      expect(res.body.productId).to.equal("123");
    });

    it("should return 500 for invalid id", async function () {
      const res = await request(app).get(
        "/api/mylist/abcdef70b0456d455fa0c0af"
      );
      expect(res.status).to.equal(500);
      expect(res.body.message).to.equal(
        "The item with the given ID was not found."
      );
    });
  });

  describe("POST /add", () => {
    it("should add new item to mylist", async function () {
      const newItem = {
        productTitle: "New Product",
        image: "new-image.jpg",
        rating: 4.0,
        price: 149.99,
        productId: "456",
        userId: "user123",
      };

      const res = await request(app).post("/api/mylist/add").send(newItem);

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property("productTitle", "New Product");
      expect(res.body.productId).to.equal("456");

      const itemInDb = await MyList.findById(res.body.id);
      expect(itemInDb).to.exist;
      expect(itemInDb.productTitle).to.equal("New Product");
    });

    it("should prevent duplicate items for same user and product", async function () {
      const duplicateItem = {
        productTitle: "Test Product",
        image: "test-image.jpg",
        rating: 4.5,
        price: 99.99,
        productId: "123",
        userId: "user123",
      };

      const res = await request(app)
        .post("/api/mylist/add")
        .send(duplicateItem);

      expect(res.status).to.equal(401);
      expect(res.body.status).to.be.false;
      expect(res.body.msg).to.equal("Product already added in the My List");
    });
  });

  describe("DELETE /:id", () => {
    it("should delete existing item", async function () {
      const res = await request(app).delete(`/api/mylist/${testItem.id}`);
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Item Deleted!");

      const itemInDb = await MyList.findById(testItem.id);
      expect(itemInDb).to.be.null;
    });

    it("should return 404 for non-existent item", async function () {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app).delete(`/api/mylist/${nonExistentId}`);

      expect(res.status).to.equal(404);
      expect(res.body.msg).to.equal("The item given id is not found!");
    });

    it("should return 404 for invalid id format", async function () {
      const res = await request(app).delete(
        "/api/mylist/abcdef70b0456d455fa0c0af"
      );
      expect(res.status).to.equal(404);
      expect(res.body.msg).to.equal("The item given id is not found!");
    });
  });
});
