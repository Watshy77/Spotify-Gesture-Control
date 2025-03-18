// Importation des modules nécessaires
import axios from 'axios';
import 'dotenv/config';
import express from 'express';
import open from 'open';
import path from "path";
import querystring from 'querystring';
import { fileURLToPath } from "url";

// Définition des variables __filename et __dirname dans un module ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Création de l'application Express
const app = express();
const PORT = 3000;

// URLs d'authentification et de token pour Spotify
const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

// Récupération des identifiants et URLs depuis les variables d'environnement
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
const MUSIXMATCH_API_KEY = process.env.MUSIXMATCH_API_KEY;

// Variable globale pour stocker le token d'accès Spotify
let accessToken = "";

// Servir le dossier public en tant que contenu statique
app.use(express.static(path.join(__dirname, "public")));

// Route de connexion : redirige l'utilisateur vers la page d'authentification Spotify
app.get('/login', (req, res) => {
    const scope = "user-modify-playback-state user-read-playback-state";
    const authURL = `${SPOTIFY_AUTH_URL}?${querystring.stringify({
        client_id: clientId,
        response_type: "code",
        redirect_uri: redirectUri,
        scope: scope
    })}`;
    res.redirect(authURL);
});

// Route de callback : récupère le code d'autorisation et échange contre un token d'accès
app.get('/callback', async (req, res) => {
    const code = req.query.code;
    try {
        const response = await axios.post(
            SPOTIFY_TOKEN_URL,
            querystring.stringify({
                grant_type: "authorization_code",
                code: code,
                redirect_uri: redirectUri,
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    // Encodage du clientId et clientSecret en base64 pour l'en-tête Authorization
                    "Authorization": "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64")
                }
            }
        );

        accessToken = response.data.access_token;
        res.redirect('/');
    } catch (error) {
        res.send("Erreur d'authentification !");
    }
});

// Fonction pour vérifier si un appareil actif est disponible sur Spotify
async function checkActiveDevice() {
    try {
        const response = await axios.get("https://api.spotify.com/v1/me/player/devices", {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const devices = response.data.devices;
        if (devices.length === 0) {
            console.log("❌ Aucun appareil actif !");
            return false;
        }
        return true;
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des appareils :", error.response?.data || error.message);
        return false;
    }
}

// Route pour mettre en pause la lecture
app.get('/pause', async (req, res) => {
    try {
        const activeDevice = await checkActiveDevice();
        if (!activeDevice) {
            return res.status(404).send("⚠️ Aucun appareil actif. Lance la lecture sur Spotify d'abord.");
        }

        await axios.put("https://api.spotify.com/v1/me/player/pause", {}, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        res.send("⏸️ Pause !");
    } catch (error) {
        console.error("❌ Erreur pause :", error.response?.data || error.message);
        res.status(500).send("Erreur lors de la pause !");
    }
});

// Route pour démarrer ou reprendre la lecture
app.get('/play', async (req, res) => {
    try {
        const activeDevice = await checkActiveDevice();
        if (!activeDevice) {
            return res.status(404).send("⚠️ Aucun appareil actif. Lance la lecture sur Spotify d'abord.");
        }

        await axios.put("https://api.spotify.com/v1/me/player/play", {}, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        res.send("▶️ Lecture !");
    } catch (error) {
        console.error("❌ Erreur lecture :", error.response?.data || error.message);
        res.status(500).send("Erreur lors de la lecture !");
    }
});

// Route pour passer au morceau suivant
app.get('/next', async (req, res) => {
    try {
        const activeDevice = await checkActiveDevice();
        if (!activeDevice) {
            return res.status(404).send("⚠️ Aucun appareil actif. Lance la lecture sur Spotify d'abord.");
        }

        await axios.post("https://api.spotify.com/v1/me/player/next", {}, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        res.send("⏭️ Morceau suivant !");
    } catch (error) {
        console.error("❌ Erreur next :", error.response?.data || error.message);
        res.status(500).send("Erreur sur next !");
    }
});

// Route pour revenir au morceau précédent
app.get('/previous', async (req, res) => {
    try {
        const activeDevice = await checkActiveDevice();
        if (!activeDevice) {
            return res.status(404).send("⚠️ Aucun appareil actif. Lance la lecture sur Spotify d'abord.");
        }

        await axios.post("https://api.spotify.com/v1/me/player/previous", {}, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        res.send("⏮️ Morceau précédent !");
    } catch (error) {
        console.error("❌ Erreur previous :", error.response?.data || error.message);
        res.status(500).send("Erreur sur previous !");
    }
});

// Variable pour gérer le volume courant
let currentVolume = 100;

// Route pour augmenter le volume
app.get('/volume/up', async (req, res) => {
    try {
        const activeDevice = await checkActiveDevice();
        if (!activeDevice) {
            return res.status(404).send("⚠️ Aucun appareil actif. Lance la lecture sur Spotify d'abord.");
        }

        // Augmentation du volume de 10, sans dépasser 100%
        currentVolume = Math.min(currentVolume + 10, 100);
        await axios.put(`https://api.spotify.com/v1/me/player/volume?volume_percent=${currentVolume}`, {}, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        res.send(`🔊 Volume augmenté : ${currentVolume}%`);
    } catch (error) {
        console.error("❌ Erreur volume up :", error.response?.data || error.message);
        res.status(500).send("Erreur volume up !");
    }
});

// Route pour diminuer le volume
app.get('/volume/down', async (req, res) => {
    try {
        const activeDevice = await checkActiveDevice();
        if (!activeDevice) {
            return res.status(404).send("⚠️ Aucun appareil actif. Lance la lecture sur Spotify d'abord.");
        }

        // Diminution du volume de 10, sans descendre en dessous de 0%
        currentVolume = Math.max(currentVolume - 10, 0);
        await axios.put(`https://api.spotify.com/v1/me/player/volume?volume_percent=${currentVolume}`, {}, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        res.send(`🔉 Volume diminué : ${currentVolume}%`);
    } catch (error) {
        console.error("❌ Erreur volume down :", error.response?.data || error.message);
        res.status(500).send("Erreur volume down !");
    }
});

// Route pour récupérer les informations du morceau en cours
app.get('/current-track', async (req, res) => {
    try {
        const response = await axios.get("https://api.spotify.com/v1/me/player/currently-playing", {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        // Vérification que des données de morceau existent
        if (!response.data || !response.data.item) {
            return res.status(404).send("⚠️ Aucune musique en cours de lecture.");
        }

        const track = response.data.item;
        res.json({
            title: track.name,
            artist: track.artists.map(artist => artist.name).join(", "),
            albumImage: track.album.images[0]?.url
        });
    } catch (error) {
        console.error("❌ Erreur récupération track :", error.response?.data || error.message);
        res.status(500).send("Erreur lors de la récupération du titre !");
    }
});

// Route pour récupérer les paroles du morceau en cours via Musixmatch
app.get('/lyrics', async (req, res) => {
    try {
        // Récupération du morceau en cours via la route /current-track
        const trackResponse = await axios.get("http://localhost:3000/current-track");
        const trackData = trackResponse.data;

        // Vérification que le morceau contient bien un titre et un artiste
        if (!trackData.title || !trackData.artist) {
            return res.json({ lyrics: "❌ Aucune chanson en cours." });
        }

        const currentArtist = trackData.artist;
        const currentTitle = trackData.title;

        // Appel à l'API Musixmatch pour récupérer les paroles
        const lyricsResponse = await axios.get(`https://api.musixmatch.com/ws/1.1/matcher.lyrics.get`, {
            params: {
                q_track: currentTitle,
                q_artist: currentArtist,
                apikey: MUSIXMATCH_API_KEY
            }
        });

        // Vérification de la présence de paroles dans la réponse
        if (lyricsResponse.data.message.body.lyrics) {
            res.json({ lyrics: lyricsResponse.data.message.body.lyrics.lyrics_body });
        } else {
            res.json({ lyrics: "❌ Paroles non disponibles." });
        }
    } catch (error) {
        console.error("❌ Erreur récupération paroles Musixmatch :", error.response?.data || error.message);
        res.json({ lyrics: "❌ Impossible de charger les paroles." });
    }
});

// Démarrage du serveur et ouverture automatique de la page de connexion Spotify
app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
    open(`http://localhost:${PORT}/login`);
});