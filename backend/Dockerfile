FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5001

CMD ["npm", "start"]
# ---- Étape 1 : build / installation des dépendances ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

# ---- Étape 2 : image finale, allégée, sans npm ----
FROM node:22-alpine

# Update Alpine packages to fix OpenSSL vulnerabilities
RUN apk update && apk upgrade

WORKDIR /app

COPY --from=builder /app ./

# Supprime le CLI npm et ses dépendances internes (tar, pacote, sigstore, etc.)
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

EXPOSE 5001

CMD ["node", "server.js"]