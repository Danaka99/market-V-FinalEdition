const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai");
const { ProductRams } = require("../../models/productRAMS");
const express = require("express");
const productRamsRoutes = require("../../routes/productRAMS");
require("dotenv").config({ path: "./.env.test" });

const app = express();
app.use(express.json());
app.use("/api/product-rams", productRamsRoutes);

describe("ProductRams Routes Integration Tests", function () {
  let testRam;

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await ProductRams.deleteMany({});

    testRam = new ProductRams({
      productRam: "8GB DDR4",
    });
    await testRam.save();
  });

  afterEach(async () => {
    await ProductRams.deleteMany({});
  });

  describe("GET /", () => {
    it("should return all RAM specifications", async function () {
      const res = await request(app).get("/api/product-rams");
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(1);
      expect(res.body[0]).to.have.property("productRam", "8GB DDR4");
    });

    it("should handle empty RAM list", async function () {
      await ProductRams.deleteMany({});
      const res = await request(app).get("/api/product-rams");
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(0);
    });
  });

  describe("GET /:id", () => {
    it("should return RAM specification by id", async function () {
      const res = await request(app).get(`/api/product-rams/${testRam.id}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("productRam", "8GB DDR4");
    });

    it("should return 500 for invalid id", async function () {
      const res = await request(app).get(
        "/api/product-rams/abcdef70b0456d455fa0c0af"
      );
      expect(res.status).to.equal(500);
      expect(res.body.message).to.equal(
        "The item with the given ID was not found."
      );
    });
  });

  describe("POST /create", () => {
    it("should create new RAM specification", async function () {
      const newRam = {
        productRam: "16GB DDR5",
      };

      const res = await request(app)
        .post("/api/product-rams/create")
        .send(newRam);

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property("productRam", "16GB DDR5");

      const ramInDb = await ProductRams.findById(res.body.id);
      expect(ramInDb).to.exist;
      expect(ramInDb.productRam).to.equal("16GB DDR5");
    });

    it("should handle missing productRam field", async function () {
      const res = await request(app).post("/api/product-rams/create").send({});

      expect(res.status).to.equal(500);
    });
  });

  describe("PUT /:id", () => {
    it("should update existing RAM specification", async function () {
      const updateData = {
        productRam: "32GB DDR4",
      };

      const res = await request(app)
        .put(`/api/product-rams/${testRam.id}`)
        .send(updateData);

      expect(res.status).to.equal(200);
      expect(res.body.productRam).to.equal("32GB DDR4");

      const ramInDb = await ProductRams.findById(testRam.id);
      expect(ramInDb.productRam).to.equal("32GB DDR4");
    });

    it("should return 500 for invalid update", async function () {
      const res = await request(app)
        .put("/api/product-rams/abcdef70b0456d455fa0c0af")
        .send({ productRam: "Test RAM" });
      expect(res.status).to.equal(500);
      expect(res.body.message).to.equal("item cannot be updated!");
    });
  });

  describe("DELETE /:id", () => {
    it("should delete existing RAM specification", async function () {
      const res = await request(app).delete(`/api/product-rams/${testRam.id}`);
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal("Item Deleted!");

      const ramInDb = await ProductRams.findById(testRam.id);
      expect(ramInDb).to.be.null;
    });

    it("should return 404 for non-existent RAM specification", async function () {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app).delete(
        `/api/product-rams/${nonExistentId}`
      );
      expect(res.status).to.equal(404);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("Item not found!");
    });
  });
});
