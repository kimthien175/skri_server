# syntax=docker/dockerfile:1

ARG NODE_VERSION=20.10.0

FROM node:${NODE_VERSION}-alpine as base
WORKDIR /home/node/app
COPY src ./src
COPY typings ./typings
COPY package*.json tsconfig.json ./
RUN npm i
COPY . .


FROM base as production
ENV NODE_PATH=./build
RUN npm run build