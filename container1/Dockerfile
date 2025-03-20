FROM node:18-alpine

WORKDIR /app

RUN mkdir -p /app/data

COPY package*.json ./

RUN npm install

COPY app1.js ./app.js

EXPOSE 6000

CMD ["node", "app.js"]