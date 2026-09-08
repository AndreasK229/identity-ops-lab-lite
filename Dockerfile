FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV IOL_API_HOST=127.0.0.1
ENV IOL_API_PORT=4173
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/server-dist ./server-dist
COPY --from=build /app/dist ./dist
COPY package.json ./package.json
EXPOSE 4173
CMD ["node", "server-dist/server/index.js"]
