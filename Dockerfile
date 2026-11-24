# Imagen base
FROM node:22-slim

# Carpeta de trabajo
WORKDIR /app

# Solo los manifests primero (cache de dependencias)
COPY package*.json ./

# Instala dependencias en producción
RUN npm ci --omit=dev

# Copia el resto del código (incluye /model)
COPY . .

# Puerto de la app (por defecto tu server usa 3000)
EXPOSE 4000

# Comando
CMD ["node", "server.js"]