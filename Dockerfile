FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
COPY tests ./tests
RUN npm run build

FROM node:24-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8785
ARG SOURCE_COMMIT=unknown
ENV SOURCE_COMMIT=$SOURCE_COMMIT
LABEL org.opencontainers.image.revision=$SOURCE_COMMIT
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist/src ./dist/src
COPY web ./web
COPY LICENSE ./LICENSE
USER node
EXPOSE 8785
CMD ["node", "dist/src/server.js"]
