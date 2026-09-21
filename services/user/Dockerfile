FROM node:22-alpine AS builder

WORKDIR /app

COPY services/user/package*.json ./

RUN npm ci

COPY services/user/tsconfig.json ./
COPY services/user/src ./src

COPY proto ./proto

RUN npm run build


FROM node:22-alpine

WORKDIR /app

COPY services/user/package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/proto ./proto

EXPOSE 50052
EXPOSE 3001

CMD ["node", "dist/server.js"]