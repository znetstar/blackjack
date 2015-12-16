FROM node:5.2.0

MAINTAINER Zachary Boyd <zachary@zacharyboyd.nyc>

ADD . /app

WORKDIR /app

EXPOSE 8000

RUN npm install

CMD npm start