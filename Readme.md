<div align="center">

# 🍲 LocalChefBazaar Server

### REST API for the LocalChefBazaar home-cooked meals marketplace

<br />

[![Live Site](https://img.shields.io/badge/%F0%9F%9A%80%20CLICK%20HERE%20TO%20VISIT%20LIVE%20SITE-c8461a?style=for-the-badge)](https://localchefbazaarbd.vercel.app)

<br />

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase_Admin-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=flat-square&logo=stripe&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

**[Live Site](https://localchefbazaarbd.vercel.app)** · **[Client Repository](https://github.com/minhazahmmed/Local-Chef-Bazar-Client)**

</div>

---

## Table of Contents

- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [API Overview](#api-overview)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Related Repository](#related-repository)
- [Developed By](#developed-by)

---

## About the Project

This is the back end of **LocalChefBazaar**, a marketplace where home chefs sell home-cooked meals and customers order, pay and review them. It exposes a secured REST API used by the [client app](https://github.com/minhazahmmed/Local-Chef-Bazar-Client), and handles authentication, role based access, orders, reviews, favorites and Stripe payments.

---

## Key Features

- **Firebase token authentication**: every secured request carries a Firebase ID token in the `Authorization: Bearer` header, verified on the server with Firebase Admin
- **Role based access control**: separate permissions for User, Chef and Admin
- **Meals**: create, update, delete, search, sort by price
- **Orders**: place an order, chef accepts or cancels, delivery allowed only after payment
- **Stripe payments**: Checkout session creation and payment confirmation
- **Reviews and favorites** with ownership checks
- **Role requests**: users can request Chef or Admin access, and admins approve, reject or reopen them
- **User moderation**: admins can change roles and mark users as fraud
- **Privacy aware public endpoints**: private fields such as emails are removed from public responses
- **Input validation** and request limits on sensitive routes
- **Serverless friendly**: cached MongoDB connection and CORS configured for the Vercel deployed client

---

## Tech Stack

| Category | Technologies |
| --- | --- |
| Runtime | Node.js 22 |
| Framework | Express |
| Database | MongoDB Atlas, MongoDB Node.js driver |
| Authentication | Firebase Admin SDK |
| Payments | Stripe |
| Security | CORS, rate limiting, token verification middleware |
| Hosting | Vercel (serverless) |

---

## API Overview

| Area | Endpoints |
| --- | --- |
| Users | `GET /users`, `POST /users`, `PATCH /users/:id/role`, `PATCH /users/:id/status` |
| Meals | `GET /meals`, `GET /meals/:id`, `POST /meals`, `PATCH /meals/:id`, `DELETE /meals/:id` |
| Orders | `POST /orders`, `GET /orders/user/:email`, `GET /orders/chef/:chefId`, `PATCH /orders/:id/status`, `DELETE /orders/:id` |
| Payments | `POST /create-checkout-session` |
| Reviews | `GET /reviews`, `GET /reviews/meal/:id`, `GET /reviews/user/:email`, `POST /reviews`, `PATCH /reviews/:id`, `DELETE /reviews/:id` |
| Favorites | `GET /favorites/user/:email`, `POST /favorites`, `DELETE /favorites/:id` |
| Role Requests | `GET /requests`, `POST /requests`, `PATCH /requests/:id` |

Secured routes require the header:

```http
Authorization: Bearer <firebase-id-token>
```

---

## Project Structure

```text
.
├── config/         Database connection
├── middlewares/    Token verification and role checks
├── routes/         Route files for each resource
├── utils/          Helpers (validators, request email, order limits)
└── index.js        App entry point
```

---

## Getting Started

### Prerequisites
- Node.js 22 or newer
- A MongoDB Atlas cluster
- A Firebase project with a service account
- A Stripe account (test mode is fine)

### Installation

```bash
git clone https://github.com/minhazahmmed/Local-Chef-Bazar-Server.git
cd Local-Chef-Bazar-Server
npm install
npm start
```

The server runs at `http://localhost:5000`.

---

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
CLIENT_URL=http://localhost:5173

MONGODB_URI=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

STRIPE_SECRET_KEY=
```

> Never commit the `.env` file. `CLIENT_URL` must include `https://` in production. Several origins can be separated with commas.

---

## Deployment

The API is deployed on **Vercel** as a serverless Express app. Add every variable above in the Vercel project settings, and allow `0.0.0.0/0` in MongoDB Atlas **Network Access** so the serverless functions can connect.

---

## Related Repository

| Repository | Description |
| --- | --- |
| [LocalChefBazaar Client](https://github.com/minhazahmmed/Local-Chef-Bazar-Client) | React front end with role based dashboards |

---

## Developed By

<div align="center">

## Minhaz Ahmmed

MERN Stack Developer


CSE Student, International Islamic University Chittagong

<br />

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/minhaz-ahmmed)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/minhazahmmed)
[![Facebook](https://img.shields.io/badge/Facebook-1877F2?style=for-the-badge&logo=facebook&logoColor=white)](<https://facebook.com/minhaz.ahmmed.98>)
[![Portfolio](https://img.shields.io/badge/Portfolio-c8461a?style=for-the-badge&logo=googlechrome&logoColor=white)](https://minhazahmmed.vercel.app)

<br />

⭐ If you like this project, please consider giving it a star.

</div>