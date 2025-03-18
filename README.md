# Teachable Machine + Spotify 🎵🤖

Ce projet permet de **contrôler la lecture de Spotify** en utilisant une **caméra et un modèle d'intelligence artificielle** entraîné avec [Teachable Machine](https://teachablemachine.withgoogle.com/). Grâce à la reconnaissance de gestes, il est possible d'envoyer des **commandes à Spotify** (lecture, pause, changement de morceau, réglage du volume). L'interface affiche dynamiquement **les informations du morceau en cours et ses paroles via l'API Musixmatch**.

---

## 🚀 Fonctionnalités

-   🎥 **Contrôle par webcam** : Utilisation de **Teachable Machine** pour détecter des gestes et exécuter des commandes Spotify.
-   🎵 **Commandes manuelles** : Boutons pour **lecture, pause, précédent, suivant et contrôle du volume**.
-   📊 **Affichage des informations du morceau** : Titre, artiste, pochette d'album.
-   🎨 **Arrière-plan dynamique** : Changement de l'arrière-plan en fonction des couleurs de la pochette d'album.
-   📝 **Affichage des paroles** : Synchronisation avec l'API **Musixmatch** pour afficher les paroles.

---

## 📋 Prérequis

-   **Node.js** (version 12 ou supérieure)
-   **npm** (Node Package Manager)
-   Un compte **Spotify** avec accès à l'**API Spotify**
-   Une clé **Musixmatch API**
-   Un modèle **Teachable Machine** exporté

---

## 🛠 Installation

### 1️⃣ Cloner le dépôt :

```bash
git clone https://github.com/votre-utilisateur/teachable-machine-spotify.git
cd teachable-machine-spotify
```

### 2️⃣ Installer les dépendances :

```bash
npm install
```

### 3️⃣ Configurer les variables d’environnement :

Créez un fichier **`.env`** à la racine du projet et ajoutez vos clés API :

```ini
SPOTIFY_CLIENT_ID=VotreSpotifyClientID
SPOTIFY_CLIENT_SECRET=VotreSpotifyClientSecret
SPOTIFY_REDIRECT_URI=VotreRedirectURI
MUSIXMATCH_API_KEY=VotreMusixmatchApiKey
```

### 4️⃣ Ajouter le modèle Teachable Machine :

Déplacez les fichiers **model.json** et **metadata.json** dans **`./my_model/`**.

---

## ▶️ Utilisation

### Démarrer le serveur :

```bash
npm start
```

Le navigateur s’ouvrira automatiquement sur la **page d’authentification Spotify**. Suivez les instructions pour autoriser l’accès.

### Contrôle de la lecture :

-   **Webcam** : Utilisez la caméra pour envoyer des commandes via les **gestes reconnus** par le modèle **Teachable Machine**.

Détails des commandes de mouvement :

-   Mettre play : Pouce en l'air
-   Mettre pause : Pouce en bas
-   Chanson suivante : Pointer du doigt sur la droite
-   Chanson précédente : Pointer du doigt sur la gauche
-   Monter le son : Pointer du doigt vers le haut
-   Baisser le son : Pointer du doigt vers le bas
-   Boutons de contrôle : Interface intuitive avec boutons pour lecture/pause, précédent/suivant et réglage du volume.

### Affichage dynamique :

-   **Informations du morceau** : Affichage en **temps réel** des **titres, artistes et pochettes** d'album.
-   **Synchronisation des paroles** : Récupération et affichage des **paroles de la chanson** en cours de lecture.
-   **Adaptation des couleurs** : Le **fond change** en fonction des **teintes de la pochette d'album**.

---

## 📁 Structure du Projet

```
/public        -> Fichiers statiques (HTML, CSS, JS client)
/my_model      -> Modèle Teachable Machine (model.json, metadata.json)
server.js      -> Serveur Express (auth Spotify, gestion des commandes)
script.js      -> Logique client (webcam, IA, animation des paroles)
.env           -> Fichier de configuration des API
```

---

## 💡 Remerciements

-   [Spotify API](https://developer.spotify.com/documentation/web-api/)
-   [Teachable Machine](https://teachablemachine.withgoogle.com/)
-   [Musixmatch API](https://developer.musixmatch.com/)

---

🚀 **Bon codage et amusez-vous bien avec la musique !** 🎶✨
