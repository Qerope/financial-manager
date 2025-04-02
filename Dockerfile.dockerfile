FROM node:20.19.0

WORKDIR /usr/src/app

COPY . .

RUN apt-get update && apt-get install -y \
    mongodb \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 27017 3000

RUN npm install --force

CMD mongod --fork --logpath /var/log/mongodb.log && node server.js && npm run dev
