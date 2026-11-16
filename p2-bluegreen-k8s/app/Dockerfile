FROM node:22-alpine AS base
WORKDIR /app
COPY package.json server.js ./
COPY tests ./tests

FROM base AS test
RUN npm test

FROM node:22-alpine AS runtime
ENV NODE_ENV=production PORT=3000
WORKDIR /app
COPY --from=base /app/package.json /app/server.js ./
USER node
EXPOSE 3000
CMD ["node", "server.js"]
