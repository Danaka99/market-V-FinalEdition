const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai");
const { Orders } = require("../../models/orders");
const express = require("express");
const orderRoutes = require("../../routes/orders");
require("dotenv").config({ path: "./.env.test" });

const app = express();
app.use(express.json());
app.use("/api/orders", orderRoutes);

describe("Orders Routes Integration Tests", function () {
  let testOrder;

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Orders.deleteMany({});

    testOrder = new Orders({
      name: "John Doe",
      phoneNumber: "1234567890",
      address: "123 Test St",
      pincode: "12345",
      amount: 99.99,
      paymentId: "pay_123",
      email: "john@test.com",
      userid: "user123",
      products: [{ id: "prod1", quantity: 2 }],
      date: new Date(),
      status: "pending",
    });
    await testOrder.save();
  });

  afterEach(async () => {
    await Orders.deleteMany({});
  });

  describe("GET /", () => {
    it("should return all orders", async function () {
      const res = await request(app).get("/api/orders");
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(1);
      expect(res.body[0]).to.have.property("name", "John Doe");
    });

    it("should filter orders based on query parameters", async function () {
      const res = await request(app)
        .get("/api/orders")
        .query({ userid: "user123" });
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body[0].userid).to.equal("user123");
    });

    it("should handle empty orders list", async function () {
      await Orders.deleteMany({});
      const res = await request(app).get("/api/orders");
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(0);
    });
  });

  describe("GET /:id", () => {
    it("should return order by id", async function () {
      const res = await request(app).get(`/api/orders/${testOrder.id}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("name", "John Doe");
      expect(res.body.email).to.equal("john@test.com");
    });

    it("should return 500 for invalid id", async function () {
      const res = await request(app).get(
        "/api/orders/abcdef70b0456d455fa0c0af"
      );
      expect(res.status).to.equal(500);
      expect(res.body.message).to.equal(
        "The order with the given ID was not found."
      );
    });
  });

  describe("GET /get/count", () => {
    it("should return total order count", async function () {
      const res = await request(app).get("/api/orders/get/count");
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("orderCount", 1);
    });

    it("should handle zero orders", async function () {
      await Orders.deleteMany({});
      const res = await request(app).get("/api/orders/get/count");
      expect(res.status).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe("POST /create", () => {
    it("should create new order", async function () {
      const newOrder = {
        name: "Jane Smith",
        phoneNumber: "9876543210",
        address: "456 Test Ave",
        pincode: "54321",
        amount: 149.99,
        paymentId: "pay_456",
        email: "jane@test.com",
        userid: "user456",
        products: [{ id: "prod2", quantity: 1 }],
        date: new Date(),
      };

      const res = await request(app).post("/api/orders/create").send(newOrder);

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property("name", "Jane Smith");
      expect(res.body.email).to.equal("jane@test.com");

      const orderInDb = await Orders.findById(res.body.id);
      expect(orderInDb).to.exist;
      expect(orderInDb.name).to.equal("Jane Smith");
    });
  });

  describe("PUT /:id", () => {
    it("should update existing order", async function () {
      const updateData = {
        name: "John Updated",
        status: "completed",
        address: "789 New Address",
      };

      const res = await request(app)
        .put(`/api/orders/${testOrder.id}`)
        .send(updateData);

      expect(res.status).to.equal(200);
      expect(res.body.name).to.equal("John Updated");
      expect(res.body.status).to.equal("completed");

      const orderInDb = await Orders.findById(testOrder.id);
      expect(orderInDb.name).to.equal("John Updated");
      expect(orderInDb.status).to.equal("completed");
    });

    it("should return 500 for invalid update", async function () {
      const res = await request(app)
        .put("/api/orders/abcdef70b0456d455fa0c0af")
        .send({ name: "Test" });
      expect(res.status).to.equal(500);
      expect(res.body.message).to.equal("Order cannot be updated!");
    });
  });

  describe("DELETE /:id", () => {
    it("should delete existing order", async function () {
      const res = await request(app).delete(`/api/orders/${testOrder.id}`);
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Order Deleted!");

      const orderInDb = await Orders.findById(testOrder.id);
      expect(orderInDb).to.be.null;
    });

    it("should return 404 for non-existent order", async function () {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app).delete(`/api/orders/${nonExistentId}`);
      expect(res.status).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("Order not found!");
    });
  });
});
