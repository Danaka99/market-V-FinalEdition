const chai = require("chai");
const mongoose = require("mongoose");
const { User } = require("../../../models/user");
require("dotenv").config({ path: "./.env.test" });
const expect = chai.expect;

describe("User Model", () => {
  before(async () => {
    await mongoose.connect(process.env.CONNECTION_STRING);
  });

  after(async () => {
    await mongoose.connection.collection("users").deleteMany({});
    await mongoose.connection.close();
  });

  it("should create a valid user", async () => {
    const user = new User({
      name: "John Doe",
      email: "john.doe@example.com",
      images: ["image1.jpg", "image2.jpg"],
    });

    const savedUser = await user.save();
    expect(savedUser).to.have.property("name", "John Doe");
    expect(savedUser).to.have.property("email", "john.doe@example.com");
    expect(savedUser.images).to.include("image1.jpg");
    expect(savedUser.images).to.include("image2.jpg");
    expect(savedUser.isAdmin).to.be.false;
  });

  it("should fail validation without required fields", async () => {
    const user = new User({});

    try {
      await user.validate();
      expect.fail("Validation should have failed");
    } catch (error) {
      expect(error.errors).to.have.property("name");
      expect(error.errors.name.message).to.equal("Path `name` is required.");

      expect(error.errors).to.have.property("email");
      expect(error.errors.email.message).to.equal("Path `email` is required.");
    }
  });

  it("should set default values correctly", async () => {
    const user = new User({
      name: "Jane Doe",
      email: "jane.doe@example.com",
      images: ["image1.jpg"],
    });

    const savedUser = await user.save();
    expect(savedUser.isAdmin).to.be.false;
  });

  it("should generate a virtual id field", async () => {
    const user = new User({
      name: "John Smith",
      email: "john.smith@example.com",
      images: ["image1.jpg"],
    });

    const savedUser = await user.save();
    expect(savedUser).to.have.property("id", savedUser._id.toHexString());
  });

  it("should handle optional fields correctly", async () => {
    const user = new User({
      name: "Alice Doe",
      email: "alice.doe@example.com",
      images: ["image1.jpg"],
      phone: "123-456-7890",
      password: "securepassword",
    });

    const savedUser = await user.save();
    expect(savedUser.phone).to.equal("123-456-7890");
    expect(savedUser.password).to.equal("securepassword");
  });
});
