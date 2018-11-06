FROM node:alpine
LABEL maintainer="Xavier Blanc <blancxav@gmail.com>"

RUN mkdir /tmp/api
WORKDIR /tmp/api

COPY api/. .

RUN npm install

EXPOSE 80

CMD ["node","server.js","--mongo=mongo", "--scheduler=scheduler"]


