FROM node:20.10.0-alpine

WORKDIR /app
COPY . .
RUN npm i
CMD ["npm", "run", "dev"]

