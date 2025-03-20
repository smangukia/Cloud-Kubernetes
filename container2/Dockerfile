FROM node:18-alpine

WORKDIR /app

RUN mkdir -p /app/data

COPY package*.json ./

RUN npm install

COPY app2.js ./app.js

EXPOSE 5001

CMD ["node", "app.js"]