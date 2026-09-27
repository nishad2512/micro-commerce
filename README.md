# Saga e-commerce services

This is a TypeScript microservices e-commerce example with a React/Vite UI, JWT access and rotated refresh authentication, gRPC product pricing, RabbitMQ Saga events, MongoDB user/wallet data, TypeORM product data, and Prisma order data.

## Run locally

1. Copy `.env.example` to `.env` and replace every secret/password value.
2. Set `JWT_ACCESS_SECRET` in `.env`; Compose passes the same value to the user, product, and order services.
3. Start infrastructure with `docker compose up --build`.
4. In another terminal run `cd frontend; npm run dev`.

The frontend runs at `http://localhost:5173`; APIs enter through `http://localhost:3000/api`.

## Kubernetes JWT secrets

The user deployment reads `jwt-access-secret` and `jwt-refresh-secret` from the `ecommerce-secrets` Secret. The order deployment reads `jwt-access-secret`; it must be the same signing key used by the user service. Add these keys to the Secret using your cluster's secure secret-management workflow before applying the deployments. Do not put JWT values in deployment manifests or commit them to the repository.

## Store pages and roles

- Signed-in users can view their order history and wallet balance/transactions.
- Admin users can create products, view all orders and update their statuses, and look up a user by ID.
- Users can add simulated development funds to their wallet; this does not process a real payment.
- Wallet payments, refunds, and simulated top-ups appear in the transaction history.
- Admin navigation is shown only when the signed-in account has the `admin` role. Create or promote admin accounts outside the public registration flow.

## Verification

Run `npm run build` from `services/user`, `services/product`, `services/order`, `services/api-gateway`, and `frontend`.

See [ARCHITECTURE.md](ARCHITECTURE.md), [EVENTS.md](EVENTS.md), and `.env.example` for the service, event, and configuration contracts.
