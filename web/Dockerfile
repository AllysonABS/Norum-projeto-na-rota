FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && chown -R appuser:appgroup /app
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --chown=appuser:appgroup server ./server

USER appuser

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["npx", "tsx", "server/index.ts"]
