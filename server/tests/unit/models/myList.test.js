const chai = require("chai");
const mongoose = require("mongoose");
const { MyList } = require("../../../models/myList");
require("dotenv").config({ path: "./.env.test" });
const expect = chai.expect;

describe("MyList Model", () => {
  let myList;

  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.close();
  });

  beforeEach(() => {
    myList = new MyList({
      productTitle: "Test Product",
      image: "test.jpg",
      rating: 4.5,
      price: 99.99,
      productId: "123",
      userId: "user123",
    });
  });

  afterEach(async () => {
    await MyList.deleteMany({});
  });

  it("should create a valid MyList with all required fields", async () => {
    await myList.validate();
    expect(myList.productTitle).to.equal("Test Product");
    expect(myList.image).to.equal("test.jpg");
    expect(myList.rating).to.equal(4.5);
    expect(myList.price).to.equal(99.99);
    expect(myList.productId).to.equal("123");
    expect(myList.userId).to.equal("user123");
  });

  it("should be invalid if required fields are missing", async () => {
    const invalidList = new MyList({});

    try {
      await invalidList.validate();
      expect.fail("Validation should have failed");
    } catch (error) {
      expect(error.errors.productTitle).to.exist;
      expect(error.errors.image).to.exist;
      expect(error.errors.rating).to.exist;
      expect(error.errors.price).to.exist;
      expect(error.errors.productId).to.exist;
      expect(error.errors.userId).to.exist;
    }
  });

  it("should generate virtual id field", () => {
    expect(myList.id).to.be.a("string");
    expect(myList.toJSON()).to.have.property("id");
  });
});
