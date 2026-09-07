FROM node:22-alpine

# Update Alpine packages to fix OpenSSL vulnerabilities
RUN apk update && apk upgrade

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5001

CMD ["npm", "start"]
