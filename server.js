import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

async function getAccessToken() {
  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`,
    { method: "POST" }
  );
  const data = await response.json();
  return data.access_token;
}

app.get("/clip/:username", async (req, res) => {
  try {
    const username = req.params.username;

    const token = await getAccessToken();

    // Obtener usuario
    const userResponse = await fetch(
      `https://api.twitch.tv/helix/users?login=${username}`,
      {
        headers: {
          "Client-ID": CLIENT_ID,
          "Authorization": `Bearer ${token}`
        }
      }
    );

    const userData = await userResponse.json();
    if (!userData.data || !userData.data[0]) {
      return res.json({ error: "Usuario no encontrado" });
    }

    const userId = userData.data[0].id;

    // Obtener último clip
    const clipResponse = await fetch(
      `https://api.twitch.tv/helix/clips?broadcaster_id=${userId}&first=1`,
      {
        headers: {
          "Client-ID": CLIENT_ID,
          "Authorization": `Bearer ${token}`
        }
      }
    );

    const clipData = await clipResponse.json();

    if (!clipData.data || !clipData.data.length) {
      return res.json({ error: "No tiene clips" });
    }

    res.json({ clipId: clipData.data[0].id });

  } catch (err) {
    res.json({ error: "Error interno", detail: err.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
