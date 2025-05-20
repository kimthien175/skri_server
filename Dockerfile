FROM node:20.10.0-alpine

RUN apk add --no-cache git

WORKDIR /app
COPY . .
RUN npm i
CMD ["npm", "run", "dev"]

