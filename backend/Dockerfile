# Utiliser une image Node officielle
FROM node:20

# Créer un dossier de travail
WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./


# Installer les dépendances
RUN npm install

# Copier le reste du code
COPY . .

# Exposer le port de l'application
EXPOSE 3001

# Lancer l'application
CMD ["npm", "start"]
