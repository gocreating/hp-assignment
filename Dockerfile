FROM node:16-alpine

WORKDIR /app

RUN yarn global add mocha

COPY package*.json ./

RUN yarn install

COPY ./src ./src

RUN mkdir -p ./file

CMD [ "node", "src/server.js" ]