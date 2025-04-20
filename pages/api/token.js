import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    console.log("🔄 Fetching JWT from /api/auth...");

    const jwtResponse = await fetch(`${process.env.BASE_URL}/api/auth`, {
      method: "POST",
    });

    if (!jwtResponse.ok) {
      throw new Error(`❌ Failed to get JWT: ${jwtResponse.statusText}`);
    }

    const { jwt_assertion } = await jwtResponse.json();

    if (!jwt_assertion) {
      throw new Error("❌ JWT assertion is missing from /api/auth response.");
    }

    console.log("✅ JWT retrieved:", jwt_assertion);

    console.log("🔄 Fetching OAuth token from Ankor API...");
    const tokenResponse = await axios.post(
      "https://api.ankor.io/iam/oauth/token",
      new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt_assertion,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("✅ OAuth token received:", tokenResponse.data.access_token);
    res.status(200).json({ accessToken: tokenResponse.data.access_token });
  } catch (error) {
    console.error(
      "❌ ERROR in /api/token:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: error.response?.data || error.message });
  }
}
