# API reference

All endpoints retain the original `/api` paths. Protected endpoints require `Authorization: Bearer <token>`.

| Method | URL | Login required | Controller function |
| --- | --- | --- | --- |
| GET | `/api/user/activity` | Yes | `activity.getActivity` |
| POST | `/api/signup` | No | `auth.signup` |
| POST | `/api/login` | No | `auth.login` |
| GET | `/api/profile` | Yes | `auth.profile` |
| GET | `/api/chats` | Yes | `chats.listChats` |
| GET | `/api/chats/:chatId` | Yes | `chats.getChat` |
| POST | `/api/chats/:chatId/message` | Yes | `chats.sendMessage` |
| GET | `/api/health` | No | `health.getHealth` |
| GET | `/api/lostfound` | No | `lostfound.listItems` |
| POST | `/api/lostfound` | Yes | `lostfound.reportItem` |
| PATCH | `/api/lostfound/:id/claim` | Yes | `lostfound.claimItem` |
| DELETE | `/api/lostfound/:id` | Yes | `lostfound.deleteItem` |
| GET | `/api/notifications` | Yes | `notifications.listNotifications` |
| PATCH | `/api/notifications/:id/read` | Yes | `notifications.readNotification` |
| PATCH | `/api/notifications/read-all` | Yes | `notifications.readAllNotifications` |
| DELETE | `/api/notifications/:id` | Yes | `notifications.deleteNotification` |
| GET | `/api/orders` | Yes | `orders.listOrders` |
| GET | `/api/products` | No | `products.listProducts` |
| POST | `/api/products` | Yes | `products.createProduct` |
| POST | `/api/products/:id/buy` | Yes | `products.buyProduct` |
| POST | `/api/products/:id/buy-request` | Yes | `products.requestPurchase` |
| POST | `/api/products/:id/approve-sale` | Yes | `products.approveSale` |
| POST | `/api/products/:id/reject-sale` | Yes | `products.rejectSale` |
| DELETE | `/api/products/:id` | Yes | `products.deleteProduct` |
| GET | `/api/rents` | No | `rents.listRents` |
| POST | `/api/rents` | Yes | `rents.createRent` |
| POST | `/api/rents/:id/rent` | Yes | `rents.rentItem` |
| POST | `/api/rents/:id/rent-request` | Yes | `rents.requestRental` |
| POST | `/api/rents/:id/approve-rent` | Yes | `rents.approveRent` |
| POST | `/api/rents/:id/reject-rent` | Yes | `rents.rejectRent` |
| DELETE | `/api/rents/:id` | Yes | `rents.deleteRent` |

Requests containing a body should use `Content-Type: application/json`.

The existing frontend demonstrates each request body. Purchase and rental requests return `chatId`; use it with the chat detail and message endpoints. Sending a chat message expects `{ "text": "Your message" }` and returns `{ "message": "Message sent!", "msg": { ... } }`.
