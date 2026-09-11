FROM node:22-alpine AS builder

WORKDIR /app

COPY services/product/package*.json ./

RUN npm ci

COPY services/product/tsconfig.json ./
COPY services/product/src ./src

COPY proto ./proto

RUN npm run build


FROM node:22-alpine

WORKDIR /app

COPY services/product/package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/proto ./proto

EXPOSE 50053

CMD ["node", "dist/server.js"]