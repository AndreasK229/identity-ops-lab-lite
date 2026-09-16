FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build

FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV IOL_API_HOST=127.0.0.1
ENV IOL_API_PORT=5173
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/server-dist ./server-dist
COPY --from=build /app/dist ./dist
COPY package.json ./package.json
EXPOSE 5173
USER node
CMD ["node", "server-dist/server/index.js"]
