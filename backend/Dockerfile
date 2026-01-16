FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8000

# Using node for production-like behavior, but can be changed to nodemon for dev
CMD ["node", "--experimental-json-modules", "src/index.js"]
