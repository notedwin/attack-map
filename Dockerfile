FROM node:lts-alpine@sha256:5c33bc6f021453ae2e393e6e20650a4df0a4737b1882d389f17069dc1933fdc5
RUN apk add dumb-init
WORKDIR /app
COPY --chown=node:node . .
RUN npm install
USER node
CMD ["npm","start"] 
EXPOSE 3000