# Étape 1 : build avec Node
FROM node:20 as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Étape 2 : serveur Nginx
FROM nginx:alpine

# Copier le dossier dist (Vite) vers Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copier configuration Nginx si nécessaire (optionnel)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
