const chai = require("chai");
const sinon = require("sinon");
const express = require("express");
const request = require("supertest");
const { ImageUpload } = require("../../../models/imageUpload");
const imageUploadRouter = require("../../../helper/imageUpload");

const expect = chai.expect;

describe("Image Upload Router", () => {
  let app, sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    app = express();
    app.use("/", imageUploadRouter);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("GET /", () => {
    it("should return list of images when found", async () => {
      const mockImages = [{ id: "1", url: "test.jpg" }];
      sandbox.stub(ImageUpload, "find").resolves(mockImages);

      const response = await request(app).get("/").expect(200);

      expect(ImageUpload.find.calledOnce).to.be.true;
      expect(response.body).to.deep.equal(mockImages);
    });

    it("should return 500 when no images found", async () => {
      sandbox.stub(ImageUpload, "find").resolves(null);

      const response = await request(app).get("/").expect(500);

      expect(ImageUpload.find.calledOnce).to.be.true;
      expect(response.body).to.deep.equal({ success: false });
    });

    it("should handle errors and return 500", async () => {
      sandbox.stub(ImageUpload, "find").rejects(new Error("Database error"));

      const response = await request(app).get("/").expect(500);

      expect(ImageUpload.find.calledOnce).to.be.true;
      expect(response.body).to.deep.equal({ success: false });
    });
  });

  describe("DELETE /deleteAllImages", () => {
    it("should delete all images when images exist", async () => {
      const mockImages = [
        { id: "1", url: "test1.jpg" },
        { id: "2", url: "test2.jpg" },
      ];
      const deletedImage = { id: "2", url: "test2.jpg" };

      sandbox.stub(ImageUpload, "find").resolves(mockImages);
      sandbox.stub(ImageUpload, "findByIdAndDelete").resolves(deletedImage);

      const response = await request(app)
        .delete("/deleteAllImages")
        .expect(200);

      expect(ImageUpload.find.calledOnce).to.be.true;
      expect(ImageUpload.findByIdAndDelete.callCount).to.equal(
        mockImages.length
      );
      expect(response.body).to.deep.equal(deletedImage);
    });

    it("should return message when no images to delete", async () => {
      sandbox.stub(ImageUpload, "find").resolves([]);

      const response = await request(app)
        .delete("/deleteAllImages")
        .expect(200);

      expect(ImageUpload.find.calledOnce).to.be.true;
      expect(response.body).to.deep.equal({ message: "No images to delete" });
    });
  });
});
