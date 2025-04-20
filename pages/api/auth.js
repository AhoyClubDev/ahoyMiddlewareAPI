import jwt from "jsonwebtoken";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const privateKey = process.env.PRIVATE_KEY;
  const keyID = process.env.KEY_ID;
  const companyURI = process.env.NEXT_PUBLIC_COMPANY_URI;

  if (!privateKey || !keyID) {
    console.error("Server misconfiguration: Private key or key ID not found");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  // JWT Payload
  const payload = {
    scopes: ["website:read:*"],
    iss: companyURI,
    aud: "ankor.io",
    sub: companyURI,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
  };

  // JWT Header
  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: keyID,
  };

  try {
    const token = jwt.sign(payload, privateKey, {
      algorithm: "RS256",
      header,
    });

    res.status(200).json({ jwt_assertion: token });
  } catch (error) {
    console.error("JWT Signing Error:", error);
    res.status(500).json({ error: "Failed to generate JWT" });
  }
}
