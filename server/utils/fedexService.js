const axios = require("axios");

// Function to get fedex token
async function getToken(apiKey, secretKey) {
  try {
    const tokenResponse = await axios.post(
      `${process.env.FEDEX_API_URL}/oauth/token`,
      {
        grant_type: "client_credentials",
        client_id: apiKey,
        client_secret: secretKey,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    var authToken = tokenResponse.data.access_token;
    return { success: true, token: authToken };
  } catch (error) {
    console.error("Error Fedex Token Generation", error);
    return { success: false, error: error.message };
  }
}

module.exports = { getToken };
