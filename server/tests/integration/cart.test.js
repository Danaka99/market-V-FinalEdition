const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai");
const { Cart } = require("../../models/cart");
const express = require("express");
const cartRoutes = require("../../routes/cart");
require("dotenv").config({ path: "./.env.test" });

const app = express();
app.use(express.json());
app.use("/api/cart", cartRoutes);

describe("Cart Routes Integration Tests", function () {
  this.timeout(10000);

  let testCartItem;

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Cart.deleteMany({});
    testCartItem = new Cart({
      productTitle: "Sample Product",
      image: "sample.jpg",
      rating: 4.5,
      price: 100,
      quantity: 1,
      subTotal: 100,
      productId: "prod123",
      userId: "user123",
      countInStock: 20,
    });
    await testCartItem.save();
  });

  afterEach(async () => {
    await Cart.deleteMany({});
  });

  describe("GET /", () => {
    it("should return all cart items", async function () {
      const res = await request(app).get("/api/cart");
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body).to.have.lengthOf(1);
      expect(res.body[0])
        .to.have.property("productTitle")
        .that.equals("Sample Product");
    });

    it("should return an empty cart if no items exist", async function () {
      await Cart.deleteMany({});
      const res = await request(app).get("/api/cart");
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array").that.is.empty;
    });
  });

  describe("GET /:id", () => {
    it("should return a specific cart item by ID", async function () {
      const res = await request(app).get(`/api/cart/${testCartItem.id}`);
      expect(res.status).to.equal(200);
      expect(res.body)
        .to.have.property("productTitle")
        .that.equals("Sample Product");
    });

    it("should return 404 for a non-existent cart item", async function () {
      const res = await request(app).get("/api/cart/abcdef70b0456d455fa0c0af");
      expect(res.status).to.equal(500);
      expect(res.body)
        .to.have.property("message")
        .that.equals("The cart item with the given ID was not found.");
    });
  });

  describe("POST /add", () => {
    it("should add a new item to the cart", async function () {
      const newCartItem = {
        productTitle: "New Product",
        image: "new-product.jpg",
        rating: 4.2,
        price: 150,
        quantity: 2,
        subTotal: 300,
        productId: "prod124",
        userId: "user124",
        countInStock: 10,
      };

      const res = await request(app).post("/api/cart/add").send(newCartItem);

      expect(res.status).to.equal(201);
      expect(res.body)
        .to.have.property("productTitle")
        .that.equals("New Product");
    });

    it("should return 401 if the product is already in the cart", async function () {
      const existingCartItem = {
        productTitle: "Sample Product",
        image: "sample.jpg",
        rating: 4.5,
        price: 100,
        quantity: 1,
        subTotal: 100,
        productId: "prod123",
        userId: "user123",
        countInStock: 20,
      };

      const res = await request(app)
        .post("/api/cart/add")
        .send(existingCartItem);

      expect(res.status).to.equal(401);
      expect(res.body).to.have.property("status").that.equals(false);
      expect(res.body)
        .to.have.property("msg")
        .that.equals("Product already added in the cart");
    });
  });

  describe("PUT /:id", () => {
    it("should update an existing cart item", async function () {
      const updatedCartItem = {
        productTitle: "Updated Product",
        image: "updated-product.jpg",
        rating: 4.8,
        price: 120,
        quantity: 2,
        subTotal: 240,
        productId: "prod123",
        userId: "user123",
      };

      const res = await request(app)
        .put(`/api/cart/${testCartItem.id}`)
        .send(updatedCartItem);

      expect(res.status).to.equal(200);
      expect(res.body)
        .to.have.property("productTitle")
        .that.equals("Updated Product");

      const cartItemInDb = await Cart.findById(testCartItem.id);
      expect(cartItemInDb.productTitle).to.equal("Updated Product");
    });

    it("should return 500 for invalid cart item ID", async function () {
      const res = await request(app)
        .put("/api/cart/abcdef70b0456d455fa0c0af")
        .send({ productTitle: "Test" });

      expect(res.status).to.equal(500);
      expect(res.body)
        .to.have.property("message")
        .that.equals("Cart item cannot be updated!");
    });
  });

  describe("DELETE /:id", () => {
    it("should delete a cart item by ID", async function () {
      const res = await request(app).delete(`/api/cart/${testCartItem.id}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success").that.equals(true);
      expect(res.body)
        .to.have.property("message")
        .that.equals("Cart Item Deleted!");

      const deletedCartItem = await Cart.findById(testCartItem.id);
      expect(deletedCartItem).to.be.null;
    });

    it("should return 404 for a non-existent cart item", async function () {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app).delete(`/api/cart/${nonExistentId}`);
      expect(res.status).to.equal(404);
      expect(res.body)
        .to.have.property("msg")
        .that.equals("The cart item given id is not found!");
    });
  });
});
