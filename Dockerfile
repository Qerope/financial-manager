FROM ubuntu:20.04

WORKDIR /usr/src/app
ENV DEBIAN_FRONTEND=noninteractive

COPY . .

RUN apt-get update && apt-get install -y tzdata \
    && ln -sf /usr/share/zoneinfo/America/New_York /etc/localtime \
    && dpkg-reconfigure -f noninteractive tzdata

RUN apt-get install -y \
    curl \
    gnupg \
    lsb-release \
    ca-certificates \
    sudo \
    gnupg2 \
    build-essential \
    git \
    python3-dev \
    && apt-get clean

RUN echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list \
    && curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | tee /etc/apt/trusted.gpg.d/mongodb.asc \
    && apt-get update -y \
    && apt-get install -y mongodb-org=6.0.4 \
    && apt-get clean

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    mkdir /db

EXPOSE 27017 3000

RUN npm install --force

CMD mongod --dbpath /db --bind_ip 0.0.0.0 & node server.js & npm run dev
