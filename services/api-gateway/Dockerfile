FROM node:22-alpine AS builder

WORKDIR /app

COPY services/api-gateway/package*.json ./

RUN npm i

COPY services/api-gateway/tsconfig.json ./
COPY services/api-gateway/src ./src

COPY proto ./proto

RUN npm run build


FROM node:22-alpine

WORKDIR /app

COPY services/api-gateway/package*.json ./

RUN npm i --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/proto ./proto

EXPOSE 3000

CMD ["node", "dist/server.js"]