### Etapa 1: Build Angular ###
FROM node:22-alpine AS build
WORKDIR /app

# Instala dependencias primero (caché de Docker)
COPY package*.json ./
RUN npm install --ignore-scripts

# Copia el resto y compila
COPY . .
RUN npx nx build demo --configuration=production

### Etapa 2: Nginx ###
FROM nginx:alpine
COPY --from=build /app/dist/apps/demo/browser /usr/share/nginx/html
COPY apps/demo/nginx.conf.template /etc/nginx/conf.d/default.conf
EXPOSE 80
