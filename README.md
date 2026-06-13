# MathQuiztador

Joc web multiplayer inspirat din ConQUIZtador, bazat pe matematica de clasa a XI-a.

## Stack

- Frontend: React + TypeScript + Vite + Tailwind + Framer Motion + Socket.io client
- Backend: Node.js + Express + TypeScript + Socket.io + MongoDB + JWT
- Shared package: tipuri comune pentru evenimente si modele de joc

## Moduri de joc

- 1v1
- 1v1v1
- Arhitectura pregatita pentru 4 jucatori

## Functionalitati principale

- Lobby privat cu cod de invitatie
- Chat in timp real in meci
- Harta interactiva cu teritorii, zoom si pan
- Cucerire teritorii prin intrebari de matematica
- Intrebari generate automat din:
  - Functii, limite, continuitate, derivate, studiul functiilor
  - Primitive, integrale, matrice, determinanti, vectori, trigonometrie
- Tipuri de intrebari:
  - Numeric
  - Alegere multipla
  - Adevarat/Fals
  - Completare expresie
  - Calcul pas cu pas
- Punctaj:
  - +100 raspuns corect la atac
  - +50 bonus viteza
  - Multiplicator de serie pentru raspunsuri consecutive
- Duel matematic (1v1v1):
  - Cand doi jucatori ataca aproape simultan acelasi teritoriu
  - Se declanseaza un duel cu intrebare mai dificila
  - Castiga cel care raspunde corect primul

## Structura proiect

- client/ - aplicatia React
- server/ - API + Socket.io + motor de joc
- shared/ - tipuri comune

## Cerinte

- Node.js 20+
- npm 10+
- MongoDB (local sau cloud)

## Configurare rapida

1. Copiaza fisierele de mediu:
   - client/.env.example -> client/.env
   - server/.env.example -> server/.env
2. Configureaza server/.env:
   - MONGODB_URI
   - JWT_SECRET
   - CLIENT_ORIGIN

## Rulare locala

Din radacina proiectului:

```bash
npm install
npm run dev
```

Aplicatiile pornesc pe:

- Frontend: http://localhost:5173
- Backend: http://localhost:4000

## Build productie

```bash
npm run build
npm run start
```

## Docker

```bash
docker compose up --build
```

## Endpoint-uri backend

- POST /api/auth/register
- POST /api/auth/login
- GET /api/leaderboard/elo
- GET /health

## Evenimente socket importante

- lobby:create, lobby:join, lobby:start
- match:attack, match:answer, match:duel-answer
- chat:send
- lobby:update, match:update, match:phase, match:result

## Publicare online

- Frontend: Vercel/Netlify
- Backend: Render/Railway/Fly.io
- MongoDB: MongoDB Atlas
- Seteaza variabilele de mediu pentru productie in platformele de deploy

## Observatii

- Aplicatia nu include AI adversar: toate meciurile sunt intre jucatori reali.
- Sistemul este modular si poate fi extins la 4 jucatori si tipuri suplimentare de harti/intrebari.
