# F1 Fantasy

Progetto per il corso di Ingegneria dei Sistemi Web.

È un fantasy della Formula 1: ti registri, componi la tua squadra di piloti rispettando un budget e i vincoli sulle scuderie, piazzi scommesse sulle gare e c'è una classifica generale. C'è anche un utente admin che può chiudere le gare e gestire il gioco.

È fatto come SPA, con il backend REST separato dal frontend e MySQL sotto.

## Stack

- Backend: Node.js + Express, MySQL con `mysql2`, `bcryptjs` per le password
- Frontend: Angular 19
- Database: MySQL 8

Backend e frontend girano su due porte diverse (3000 e 4200), quindi il backend ha CORS abilitato verso il frontend.

## Cosa serve

Io l'ho fatto girare tutto su WSL (Ubuntu). Serve:

- Node.js (ho usato la 20) e npm
- MySQL 8

Se su WSL non hai MySQL:

```bash
sudo apt update
sudo apt install mysql-server
```

Per Node va bene il pacchetto della distro oppure nvm.

## Come farlo partire

### 1. Database

Le credenziali del DB sono scritte direttamente in `backend/config.js` (utente `f1fantasy`, password `f1fantasy!`, database `f1db`). Il dump `f1db.sql` crea solo tabelle e dati, quindi il database e l'utente vanno creati prima.

Avvia MySQL ed entra come root:

```bash
sudo service mysql start
sudo mysql
```

Crea database e utente:

```sql
CREATE DATABASE f1db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'f1fantasy'@'localhost' IDENTIFIED BY 'f1fantasy!';
GRANT ALL PRIVILEGES ON f1db.* TO 'f1fantasy'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Poi importa il dump, dalla cartella del progetto:

```bash
mysql -u f1fantasy -p f1db < f1db.sql
```

(la password quando la chiede è `f1fantasy!`)

Se cambi utente, password o nome del database ricordati di aggiornare anche `backend/config.js`.

### 2. Backend

```bash
cd backend
npm install
npm start
```

Parte su http://localhost:3000/api. Con `npm run dev` gira con nodemon e si riavvia da solo quando modifichi qualcosa.

### 3. Frontend

In un altro terminale:

```bash
cd frontend
npm install
npm start
```

Apri http://localhost:4200. Ovviamente deve girare anche il backend, altrimenti le chiamate vanno in errore.

## Utenti di prova

Il dump inserisce già qualche utente per provare al volo (nel DB le password sono hash bcrypt, qui in chiaro solo per comodità):

- `admin` / `admin123` — amministratore, vede anche la sezione admin
- `mario` / `mario123`
- `giulia` / `giulia123`

## Com'è organizzato

Il backend segue il pattern visto a lezione: `app.js` monta i router sotto `/api`, ogni router usa un DAO e i DAO parlano col database tramite `services/db.js`. Le regole del fantasy (budget massimo, numero minimo/massimo di piloti, massimo per scuderia) stanno in `config.js`, così sono in un posto solo.

```
backend/
  app.js          punto di ingresso, monta i router
  config.js       porta, CORS, credenziali DB, regole del gioco
  routes/         un file per risorsa (user, driver, race, fantateam, bet, leaderboard, admin)
  dao/            accesso ai dati
  services/       connessione al DB e calcolo delle quote
  middleware/     controllo dell'admin
frontend/
  src/app/features/   le schermate
  src/app/servizi/    le chiamate all'API
  src/app/modelli/    i modelli TypeScript
f1db.sql          schema + dati di partenza
```

Il frontend è diviso nelle conversazioni richieste dal progetto: login/registrazione e profilo, lista e dettaglio piloti, i fantateam, le scommesse, la classifica e la parte admin.
