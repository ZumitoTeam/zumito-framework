#Base stage
FROM node:18.16.0-slim AS base
RUN apt update && \
    npm i -g npm@latest

WORKDIR /zumito-framework

# Development stage
FROM base AS dev
RUN apt update && \
    apt install -y git

USER node
CMD [ "bash" ]
