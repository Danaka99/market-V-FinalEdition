const chai = require("chai");
const mongoose = require("mongoose");
const { CompareList } = require("../../../models/compareList");
require("dotenv").config({ path: "./.env.test" });

const expect = chai.expect;

describe("CompareList Model", () => {
  let compareList;

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(() => {
    compareList = new CompareList({
      productTitle: "Compare Product",
      image: "compare.jpg",
      rating: 4.7,
      price: 149.99,
      productId: "prod456",
      userId: "user456",
    });
  });

  afterEach(async () => {
    await CompareList.deleteMany({});
  });

  it("should create a valid CompareList with all required fields", async () => {
    await compareList.validate();
    expect(compareList.productTitle).to.equal("Compare Product");
    expect(compareList.image).to.equal("compare.jpg");
    expect(compareList.rating).to.equal(4.7);
    expect(compareList.price).to.equal(149.99);
    expect(compareList.productId).to.equal("prod456");
    expect(compareList.userId).to.equal("user456");
  });

  it("should be invalid if required fields are missing", async () => {
    const invalidCompareList = new CompareList({});

    try {
      await invalidCompareList.validate();
      expect.fail("Validation should have failed");
    } catch (err) {
      expect(err.errors.productTitle).to.exist;
      expect(err.errors.image).to.exist;
      expect(err.errors.rating).to.exist;
      expect(err.errors.price).to.exist;
      expect(err.errors.productId).to.exist;
      expect(err.errors.userId).to.exist;
    }
  });

  it("should generate a virtual id field", () => {
    expect(compareList.id).to.be.a("string");
    expect(compareList.toJSON()).to.have.property("id");
  });
});
