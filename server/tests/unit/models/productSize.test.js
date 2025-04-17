const chai = require("chai");
const mongoose = require("mongoose");
const { ProductSize } = require("../../../models/productSize");
require("dotenv").config({ path: "./.env.test" });
const expect = chai.expect;

describe("ProductSize Model", () => {
  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await ProductSize.deleteMany({});
  });

  it("should create a valid product size", async () => {
    const size = new ProductSize({
      size: "XL",
    });

    const savedSize = await size.save();
    expect(savedSize._id).to.exist;
    expect(savedSize.size).to.equal("XL");
  });

  it("should set default value to null when size is not provided", async () => {
    const size = new ProductSize({});
    const savedSize = await size.save();
    expect(savedSize.size).to.be.null;
  });

  it("should generate virtual id field", async () => {
    const size = new ProductSize({ size: "M" });
    const savedSize = await size.save();
    expect(savedSize.id).to.equal(savedSize._id.toHexString());
  });
});
