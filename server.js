require("dotenv").config();

const { jwtVerify, createRemoteJWKSet } = require("jose");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const path = require("path");
app.use(express.static(path.join(__dirname, "dist")));

const REGION = process.env.AWS_REGION || "us-east-2";

const jwks = createRemoteJWKSet(
  new URL(
    `https://cognito-idp.${REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`
  )
);

async function verifyToken(token) {
  const { payload } = await jwtVerify(token, jwks, {
    issuer: `https://cognito-idp.${REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
  });
  return payload;
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/exchange", async (req, res) => {
  try {
    const code = req.body?.code;
    if (!code) return res.status(400).json({ error: "Missing code" });

    const fetch = require("node-fetch");

    const tokenUrl = `${process.env.COGNITO_DOMAIN}/oauth2/token`;

    const basicAuth = Buffer.from(
      `${process.env.COGNITO_CLIENT_ID}:${process.env.COGNITO_CLIENT_SECRET}`
    ).toString("base64");

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.COGNITO_CLIENT_ID,
      code,
      redirect_uri: process.env.COGNITO_REDIRECT_URI,
    });

    const resp = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: body.toString(),
    });

    const data = await resp.json();
    return res.status(resp.ok ? 200 : resp.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
});

app.post("/api/presign-upload", async (req, res) => {
  try {
    // 1) Require bearer token
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing Bearer token" });
    }

    // 2) Verify token and extract claims
    const token = auth.replace("Bearer ", "");
    let user;
    let groups = [];
    let isAdmin = false;
    let agencyClaim;

    try {
      user = await verifyToken(token);
      groups = user["cognito:groups"] || [];
      isAdmin = groups.includes("admin");
      agencyClaim = user["custom:agency"];
    } catch (e) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // 3) Authorize role
    if (!groups.includes("agency") && !isAdmin) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // 4) Require agency claim for non-admins
    if (!isAdmin && !agencyClaim) {
      return res.status(400).json({ error: "Missing custom:agency" });
    }

    // 5) Validate request
    const { filename, contentType } = req.body || {};
    if (!filename) return res.status(400).json({ error: "Missing filename" });

    // 6) Presign S3 PUT
    const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
    const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

    const s3 = new S3Client({ region: REGION });

    const agency = isAdmin ? "ADMIN_UPLOADS" : agencyClaim;
    const key = `${agency}/${Date.now()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: "mtp-transfer",
      Key: key,
      ContentType: contentType || "application/octet-stream",
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    return res.json({ uploadUrl, key });
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
});

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});