# Hardened multi-stage build for the MediSecure healthcare service
FROM node:22-alpine AS base
WORKDIR /app
COPY package.json server.js patients.json ./
COPY public ./public
COPY tests ./tests

FROM base AS test
RUN npm test

FROM node:22-alpine AS runtime
# Remove the package managers from the runtime image: they are not needed and carry most of the known CVEs
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /opt/yarn* /usr/local/bin/yarn /usr/local/bin/yarnpkg
ENV NODE_ENV=production PORT=3000
WORKDIR /app
COPY --from=base --chown=root:root /app/package.json /app/server.js /app/patients.json ./
COPY --from=base --chown=root:root /app/public ./public
USER 1000
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "server.js"]
