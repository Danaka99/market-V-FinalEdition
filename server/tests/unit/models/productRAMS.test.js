const chai = require("chai");
const mongoose = require("mongoose");
const { ProductRams } = require("../../../models/productRAMS");
require("dotenv").config({ path: "./.env.test" });
const expect = chai.expect;

describe("ProductRams Model", () => {
  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await ProductRams.deleteMany({});
  });

  it("should create a valid productRam", async () => {
    const productRam = new ProductRams({
      productRam: "8GB",
    });

    const savedProductRam = await productRam.save();
    expect(savedProductRam._id).to.exist;
    expect(savedProductRam.productRam).to.equal("8GB");
  });

  it("should set default value to null when productRam is not provided", async () => {
    const productRam = new ProductRams({});
    const savedProductRam = await productRam.save();
    expect(savedProductRam.productRam).to.be.null;
  });

  it("should generate virtual id field", async () => {
    const productRam = new ProductRams({
      productRam: "16GB",
    });

    const savedProductRam = await productRam.save();
    expect(savedProductRam.id).to.be.a("string");
    expect(savedProductRam.id).to.equal(savedProductRam._id.toHexString());
  });
});
