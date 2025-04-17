const chai = require("chai");
const mongoose = require("mongoose");
const { ProductWeight } = require("../../../models/productWeight");
require("dotenv").config({ path: "./.env.test" });
const expect = chai.expect;

describe("ProductWeight Model", () => {
  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await ProductWeight.deleteMany({});
  });

  it("should create a valid product weight", async () => {
    const weight = new ProductWeight({
      productWeight: "500g",
    });

    const savedWeight = await weight.save();
    expect(savedWeight._id).to.exist;
    expect(savedWeight.productWeight).to.equal("500g");
  });

  it("should set default value to null when weight is not provided", async () => {
    const weight = new ProductWeight({});
    const savedWeight = await weight.save();
    expect(savedWeight.productWeight).to.be.null;
  });

  it("should generate virtual id field", async () => {
    const weight = new ProductWeight({ productWeight: "1kg" });
    const savedWeight = await weight.save();
    expect(savedWeight.id).to.equal(savedWeight._id.toHexString());
  });
});
