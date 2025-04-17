const chai = require("chai");
const sinon = require("sinon");
const expect = chai.expect;
const cloudinary = require("cloudinary").v2;

describe("Cloudinary Configuration", () => {
  let configStub;

  beforeEach(() => {
    delete require.cache[require.resolve("../../../helper/cloudinary")];

    require("dotenv").config({ path: "./.env.test" });

    configStub = sinon.stub(cloudinary, "config");
  });

  afterEach(() => {
    configStub.restore();
  });

  it("should configure cloudinary with environment variables", () => {
    const mockConfig = {
      cloud_name: process.env.cloudinary_Config_Cloud_Name,
      api_key: process.env.cloudinary_Config_api_key,
      api_secret: process.env.cloudinary_Config_api_secret,
      secure: true,
    };

    require("../../../helper/cloudinary");

    expect(configStub.calledOnce).to.be.true;
    expect(configStub.firstCall.args[0]).to.deep.equal(mockConfig);
  });
});
