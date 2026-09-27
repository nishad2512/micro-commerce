# Event flow

All services publish durable JSON messages to the `ecommerce.events` topic exchange.

| Event | Producer | Consumer | Effect |
| --- | --- | --- | --- |
| `order.created` | Order | Product, User | reserve inventory and debit wallet |
| `inventory.reserved` | Product | none yet | audit/extension point |
| `inventory.failed` | Product | Order | cancel order and request refund |
| `payment.success` | User | Order | confirm the pending order |
| `payment.failed` | User | Order | cancel the order and release stock |
| `inventory.release` | Order | Product | restore reserved stock |
| `payment.refund` | Order | User | refund a completed wallet debit |

Product reservations run in one PostgreSQL transaction with row locks. A failed item rolls the whole reservation back before `inventory.failed` is emitted. Consumer acknowledgements happen only after the handler returns; the user service retains its three-attempt retry queue and DLQ.
