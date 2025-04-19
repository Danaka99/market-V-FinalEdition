const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai");
const { ProductSize } = require("../../models/productSize");
const express = require("express");
const productSizeRoutes = require("../../routes/productSize");
require("dotenv").config({ path: "./.env.test" });

const app = express();
app.use(express.json());
app.use("/api/product-sizes", productSizeRoutes);

describe("Product Size Routes Integration Tests", function () {
  let testSize;

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await ProductSize.deleteMany({});

    testSize = new ProductSize({
      size: "XL",
    });
    await testSize.save();
  });

  afterEach(async () => {
    await ProductSize.deleteMany({});
  });

  describe("GET /", () => {
    it("should return all product sizes", async function () {
      const res = await request(app).get("/api/product-sizes");

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(1);
      expect(res.body[0]).to.have.property("size");
      expect(res.body[0].size).to.equal("XL");
    });

    it("should handle empty product sizes list", async function () {
      await ProductSize.deleteMany({});
      const res = await request(app).get("/api/product-sizes");

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(0);
    });

    it("should handle database errors", async function () {
      await mongoose.connection.close();

      const res = await request(app).get("/api/product-sizes");
      expect(res.status).to.equal(500);
      expect(res.body.success).to.be.false;

      await mongoose.connect(process.env.CONNECTION_STRING);
    });
  });

  describe("GET /:id", () => {
    it("should return product size by id", async function () {
      const res = await request(app).get(`/api/product-sizes/${testSize.id}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("size");
      expect(res.body.size).to.equal("XL");
    });

    it("should return 500 for invalid id", async function () {
      const res = await request(app).get(
        "/api/product-sizes/abcdef70b0456d455fa0c0af"
      );

      expect(res.status).to.equal(500);
      expect(res.body).to.have.property("message");
      expect(res.body.message).to.equal(
        "The item with the given ID was not found."
      );
    });
  });

  describe("POST /create", () => {
    it("should create new product size", async function () {
      const newSize = {
        size: "XXL",
      };

      const res = await request(app)
        .post("/api/product-sizes/create")
        .send(newSize);

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property("_id");
      expect(res.body.size).to.equal("XXL");

      const sizeInDb = await ProductSize.findById(res.body._id);
      expect(sizeInDb).to.exist;
      expect(sizeInDb.size).to.equal("XXL");
    });

    it("should require size field", async function () {
      const incompleteSize = {};

      const res = await request(app)
        .post("/api/product-sizes/create")
        .send(incompleteSize);

      expect(res.status).to.equal(500);
      expect(res.body.success).to.be.false;
    });
  });

  describe("PUT /:id", () => {
    it("should update existing product size", async function () {
      const updateData = {
        size: "M",
      };

      const res = await request(app)
        .put(`/api/product-sizes/${testSize.id}`)
        .send(updateData);

      expect(res.status).to.equal(200);
      expect(res.body.size).to.equal("M");

      const sizeInDb = await ProductSize.findById(testSize.id);
      expect(sizeInDb.size).to.equal("M");
    });

    it("should return 500 for invalid update", async function () {
      const res = await request(app)
        .put("/api/product-sizes/abcdef70b0456d455fa0c0af")
        .send({ size: "S" });

      expect(res.status).to.equal(500);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("item cannot be updated!");
    });
  });

  describe("DELETE /:id", () => {
    it("should delete existing product size", async function () {
      const res = await request(app).delete(
        `/api/product-sizes/${testSize.id}`
      );

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Item Deleted!");

      const sizeInDb = await ProductSize.findById(testSize.id);
      expect(sizeInDb).to.be.null;
    });

    it("should return 404 for non-existent product size", async function () {
      await ProductSize.findByIdAndDelete(testSize.id);

      const res = await request(app).delete(
        `/api/product-sizes/${testSize.id}`
      );

      expect(res.status).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("Item not found!");
    });
  });
});
