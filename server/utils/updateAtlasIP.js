
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const {
  ATLAS_CLIENT_ID,
  ATLAS_CLIENT_SECRET,
  ATLAS_PROJECT_ID
} = process.env;

const ATLAS_API =
  "https://cloud.mongodb.com/api/atlas/v2";

async function getAtlasToken() {
  const response = await axios.post(
    "https://cloud.mongodb.com/api/oauth/token",
    new URLSearchParams({
      grant_type: "client_credentials"
    }),
    {
      auth: {
        username: ATLAS_CLIENT_ID,
        password: ATLAS_CLIENT_SECRET
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
  );

  return response.data.access_token;
}

export async function updateAtlasIP() {
  if (!ATLAS_CLIENT_ID ||
      !ATLAS_CLIENT_SECRET ||
      !ATLAS_PROJECT_ID) {
    throw new Error("Missing Atlas API credentials");
  }

  const { data: ipData } = await axios.get(
    "https://api.ipify.org?format=json",
    { timeout: 10000 }
  );

  const currentIP = ipData.ip;
  console.log("Current public IP:", currentIP);

  const token = await getAtlasToken();

  const url =
    `${ATLAS_API}/groups/${ATLAS_PROJECT_ID}/accessList`;

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.atlas.2025-03-12+json",
    "Content-Type": "application/json"
  };

  const { data } = await axios.get(url, { headers });

  const exists = data.results?.some(
    (entry) => entry.ipAddress === currentIP ||
      entry.cidrBlock === `${currentIP}/32`
  );

  if (exists) {
    console.log("IP already allowed in MongoDB Atlas");
    return;
  }

  const deleteAfter = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  ).toISOString();

  await axios.post(
    url,
    [{
      ipAddress: currentIP,
      comment: "Automatic local development access",
      deleteAfterDate: deleteAfter
    }],
    { headers }
  );

  console.log("IP successfully added to MongoDB Atlas");
}
