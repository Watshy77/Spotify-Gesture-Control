// Chemin vers le modèle Teachable Machine
const URL = "./my_model/";

// Déclaration des variables globales
let model, webcam, labelContainer, maxPredictions;
const cooldownTime = 1000; // Temps d'attente entre commandes (en ms)
let lastExecution = {};
const colorThief = new ColorThief(); // Pour extraire des couleurs de l'image d'album
let isPlaying = false;
let animationFrames = [];

/* 
 * Initialisation du modèle, de la webcam et des éléments UI
 */
async function init() {
    try {
        // Récupération de la piste en cours
        getCurrentTrack();

        // Chargement du modèle et des métadonnées
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // Configuration et démarrage de la webcam
        webcam = new tmImage.Webcam(400, 400, true);
        await webcam.setup();
        await webcam.play();
        window.requestAnimationFrame(loop);

        // Insertion du canvas de la webcam dans le DOM
        document.getElementById("webcam-container").appendChild(webcam.canvas);
        labelContainer = document.getElementById("label-container");

        // Création d'un div par classe pour afficher les prédictions
        for (let i = 0; i < maxPredictions; i++) {
            labelContainer.appendChild(document.createElement("div"));
        }

        console.log("🎥 Webcam activée !");
    } catch (error) {
        console.error("❌ Erreur d'initialisation :", error);
    }
}

/*
 * Boucle d'animation : met à jour la webcam et lance la prédiction
 */
async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

/*
 * Exécute une commande avec gestion d'un délai (cooldown) pour éviter les répétitions rapides
 */
async function executeCommand(command) {
    const now = Date.now();
    if (!lastExecution[command] || now - lastExecution[command] > cooldownTime) {
        sendSpotifyCommand(command);
        lastExecution[command] = now;

        // Mise à jour de la piste et des paroles pour les commandes de navigation
        if (command === "next" || command === "previous") {
            setTimeout(() => {
                getCurrentTrack();
                getLyrics();
            }, 500);
        }

        // Gestion du statut de lecture et des animations
        if (command === "pause") {
            isPlaying = false;
            stopAllAnimations();
        }
        if (command === "play") {
            isPlaying = true;
            resumeAnimations();
        }
    }
}

/*
 * Envoie la commande à l'API Spotify et met à jour l'interface
 */
async function sendSpotifyCommand(command) {
    try {
        document.getElementById("status").innerText = `⏳ Envoi : ${command}...`;
        const response = await fetch(`/${command}`);
        const message = await response.text();
        document.getElementById("status").innerText = message;
    } catch (error) {
        document.getElementById("status").innerText = "❌ Erreur d'envoi !";
    }
}

/*
 * Effectue une prédiction à partir de la webcam et déclenche les commandes associées
 */
async function predict() {
    try {
        const prediction = await model.predict(webcam.canvas);

        // Affichage des résultats dans le labelContainer
        for (let i = 0; i < maxPredictions; i++) {
            labelContainer.childNodes[i].innerHTML =
                prediction[i].className + ": " + prediction[i].probability.toFixed(2);
        }

        // Déclenchement des commandes selon la probabilité
        if (prediction[0].probability > 0.90) executeCommand("play");
        if (prediction[1].probability > 0.90) executeCommand("pause");
        if (prediction[2].probability > 0.90) executeCommand("volume/up");
        if (prediction[3].probability > 0.90) executeCommand("volume/down");
        if (prediction[4].probability > 0.90) executeCommand("next");
        if (prediction[5].probability > 0.90) executeCommand("previous");

    } catch (error) {
        console.error("⚠️ Erreur prédiction :", error);
    }
}

/*
 * Récupère et affiche les informations de la piste courante, et met à jour l'image d'album
 */
async function getCurrentTrack() {
    try {
        const response = await fetch('/current-track');
        const data = await response.json();

        if (data.title) {
            document.getElementById("track-title").innerHTML = `🎵 Titre : <span>${data.title}</span>`;
            document.getElementById("track-artist").innerHTML = `👨‍🎤 Artiste : <span>${data.artist}</span>`;

            const albumCover = document.getElementById("album-cover");
            albumCover.crossOrigin = "anonymous";
            albumCover.src = data.albumImage;
            albumCover.style.display = "block";

            albumCover.onload = () => {
                if (albumCover.complete) {
                    updateBackgroundGradient(albumCover);
                }
            };
        } else {
            document.getElementById("track-title").innerHTML = `🎵 Titre : <span>...</span>`;
            document.getElementById("track-artist").innerHTML = `👨‍🎤 Artiste : <span>...</span>`;
            document.getElementById("album-cover").style.display = "none";
        }
    } catch (error) {
        console.error("❌ Erreur récupération track :", error);
    }
}

/*
 * Met à jour le fond de la page avec un dégradé basé sur les couleurs de l'image d'album
 */
function updateBackgroundGradient(image) {
    try {
        const palette = colorThief.getPalette(image, 2);
        if (palette.length < 2) return;

        const color1 = `rgb(${palette[0][0]}, ${palette[0][1]}, ${palette[0][2]})`;
        const color2 = `rgb(${palette[1][0]}, ${palette[1][1]}, ${palette[1][2]})`;

        document.body.style.transition = "background 1s ease-in-out";
        document.body.style.background = `linear-gradient(135deg, ${color1}, ${color2})`;

        // Ajuste la couleur du texte selon la luminosité moyenne
        const brightness1 = (palette[0][0] * 0.299 + palette[0][1] * 0.587 + palette[0][2] * 0.114);
        const brightness2 = (palette[1][0] * 0.299 + palette[1][1] * 0.587 + palette[1][2] * 0.114);
        const averageBrightness = (brightness1 + brightness2) / 2;
        document.body.style.color = averageBrightness > 128 ? "black" : "white";
    } catch (error) {
        console.error("❌ Erreur extraction couleurs :", error);
    }
}

/*
 * Récupère les paroles depuis l'API et lance l'animation de fond
 */
async function getLyrics() {
    try {
        const response = await fetch('/lyrics');
        const data = await response.json();
        if (data.lyrics) {
            displayLyricsBackground(data.lyrics);
        }
    } catch (error) {
        console.error("❌ Erreur récupération paroles :", error);
    }
}

/*
 * Affiche les paroles en mouvement en arrière-plan
 */
function displayLyricsBackground(lyrics) {
    const words = lyrics.split(" ");
    const container = document.getElementById("lyrics-background");
    container.innerHTML = "";

    words.forEach((word) => {
        const span = document.createElement("span");
        span.classList.add("lyrics-word");
        span.textContent = word;

        // Position et vitesse aléatoires pour l'animation
        const posX = Math.random() * window.innerWidth;
        const posY = Math.random() * window.innerHeight;
        const speedX = (Math.random() * 0.5 + 0.3) * (Math.random() < 0.5 ? -1 : 1);
        const speedY = (Math.random() * 0.5 + 0.3) * (Math.random() < 0.5 ? -1 : 1);

        span.style.left = `${posX}px`;
        span.style.top = `${posY}px`;
        container.appendChild(span);

        moveWord(span, posX, posY, speedX, speedY);
    });
}

/*
 * Anime le déplacement d'un mot (élément) dans le background
 */
function moveWord(element, posX, posY, speedX, speedY) {
    function animate() {
        if (!isPlaying) return;

        posX += speedX;
        posY += speedY;

        // Inversion de la direction en cas de collision avec les bords
        if (posX <= 0 || posX + element.clientWidth >= window.innerWidth) {
            speedX *= -1;
        }
        if (posY <= 0 || posY + element.clientHeight >= window.innerHeight) {
            speedY *= -1;
        }

        element.style.left = `${posX}px`;
        element.style.top = `${posY}px`;
        const frameId = requestAnimationFrame(animate);
        animationFrames.push(frameId);
    }
    const frameId = requestAnimationFrame(animate);
    animationFrames.push(frameId);
}

/*
 * Arrête toutes les animations en cours
 */
function stopAllAnimations() {
    animationFrames.forEach(frameId => cancelAnimationFrame(frameId));
    animationFrames = [];
}

/*
 * Redémarre les animations pour tous les mots de paroles affichés
 */
function resumeAnimations() {
    document.querySelectorAll(".lyrics-word").forEach(word => {
        const posX = parseFloat(word.style.left);
        const posY = parseFloat(word.style.top);
        const speedX = (Math.random() * 0.5 + 0.3) * (Math.random() < 0.5 ? -1 : 1);
        const speedY = (Math.random() * 0.5 + 0.3) * (Math.random() < 0.5 ? -1 : 1);
        moveWord(word, posX, posY, speedX, speedY);
    });
}

/*
 * Vérifie régulièrement si une piste est en cours de lecture
 */
async function checkIfPlaying() {
    try {
        const response = await fetch('/current-track');
        const data = await response.json();
        isPlaying = !!data.title;
    } catch (error) {
        console.error("❌ Erreur récupération statut lecture :", error);
    }
}

// Lancement initial des paroles et vérification périodique du statut de lecture
getLyrics();
setInterval(checkIfPlaying, 3000);