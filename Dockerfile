FROM node:20.10.0-alpine

WORKDIR /app
COPY package*.json .
COPY tsconfig.json .
COPY src ./src

RUN npm i
CMD ["npm", "run", "dev"]

