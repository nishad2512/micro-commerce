FROM node:22-alpine AS builder
WORKDIR /app

COPY services/order/package*.json ./
RUN npm i

COPY services/order/prisma ./prisma
RUN npx prisma generate

COPY services/order/tsconfig.json ./
COPY services/order/src ./src
COPY proto ./proto

RUN npm run build


FROM node:22-alpine
WORKDIR /app

COPY services/order/package*.json ./
RUN npm i --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/proto ./proto

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/prisma ./prisma

EXPOSE 50051

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]