const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai");
const { ProductWeight } = require("../../models/productWeight");
const express = require("express");
const productWeightRoutes = require("../../routes/productWeight");
require("dotenv").config({ path: "./.env.test" });

const app = express();
app.use(express.json());
app.use("/api/product-weights", productWeightRoutes);

describe("Product Weight Routes Integration Tests", function () {
  let testWeight;

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await ProductWeight.deleteMany({});

    testWeight = new ProductWeight({
      productWeight: "500g",
    });
    await testWeight.save();
  });

  afterEach(async () => {
    await ProductWeight.deleteMany({});
  });

  describe("GET /", () => {
    it("should return all product weights", async function () {
      const res = await request(app).get("/api/product-weights");

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(1);
      expect(res.body[0]).to.have.property("productWeight");
      expect(res.body[0].productWeight).to.equal("500g");
    });

    it("should handle empty product weights list", async function () {
      await ProductWeight.deleteMany({});
      const res = await request(app).get("/api/product-weights");

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(0);
    });

    it("should handle database errors", async function () {
      await mongoose.connection.close();

      const res = await request(app).get("/api/product-weights");
      expect(res.status).to.equal(500);
      expect(res.body.success).to.be.false;

      await mongoose.connect(process.env.CONNECTION_STRING);
    });
  });

  describe("GET /:id", () => {
    it("should return product weight by id", async function () {
      const res = await request(app).get(
        `/api/product-weights/${testWeight.id}`
      );

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("productWeight");
      expect(res.body.productWeight).to.equal("500g");
    });

    it("should return 500 for invalid id", async function () {
      const res = await request(app).get(
        "/api/product-weights/abcdef70b0456d455fa0c0af"
      );

      expect(res.status).to.equal(500);
      expect(res.body).to.have.property("message");
      expect(res.body.message).to.equal(
        "The item with the given ID was not found."
      );
    });
  });

  describe("POST /create", () => {
    it("should create new product weight", async function () {
      const newWeight = {
        productWeight: "1kg",
      };

      const res = await request(app)
        .post("/api/product-weights/create")
        .send(newWeight);

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property("_id");
      expect(res.body.productWeight).to.equal("1kg");

      const weightInDb = await ProductWeight.findById(res.body._id);
      expect(weightInDb).to.exist;
      expect(weightInDb.productWeight).to.equal("1kg");
    });

    it("should require productWeight field", async function () {
      const incompleteWeight = {};

      const res = await request(app)
        .post("/api/product-weights/create")
        .send(incompleteWeight);

      expect(res.status).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe("PUT /:id", () => {
    it("should update existing product weight", async function () {
      const updateData = {
        productWeight: "750g",
      };

      const res = await request(app)
        .put(`/api/product-weights/${testWeight.id}`)
        .send(updateData);

      expect(res.status).to.equal(200);
      expect(res.body.productWeight).to.equal("750g");

      const weightInDb = await ProductWeight.findById(testWeight.id);
      expect(weightInDb.productWeight).to.equal("750g");
    });

    it("should return 500 for invalid update", async function () {
      const res = await request(app)
        .put("/api/product-weights/abcdef70b0456d455fa0c0af")
        .send({ productWeight: "2kg" });

      expect(res.status).to.equal(500);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("item cannot be updated!");
    });
  });

  describe("DELETE /:id", () => {
    it("should delete existing product weight", async function () {
      const res = await request(app).delete(
        `/api/product-weights/${testWeight.id}`
      );

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Item Deleted!");

      const weightInDb = await ProductWeight.findById(testWeight.id);
      expect(weightInDb).to.be.null;
    });

    it("should return 404 for non-existent product weight", async function () {
      await ProductWeight.findByIdAndDelete(testWeight.id);

      const res = await request(app).delete(
        `/api/product-weights/${testWeight.id}`
      );

      expect(res.status).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("Item not found!");
    });
  });
});
