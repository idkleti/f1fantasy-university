-- =======================================================================
-- f1db.sql - Schema per il progetto F1 Fantasy
-- Ingegneria dei Sistemi Web - MySQL Community Edition 8.0.16+
--
-- Modifiche rispetto al dump originale (vedi f1db_originale.sql):
--  - Rimosse le tabelle non utilizzate dal progetto:
--      * motore, monoposto, penalita
--  - Modificate le tabelle esistenti:
--      * pilota   -> aggiunti scuderia_corrente e costo_fantasy
--                    rimossi altezza e peso (irrilevanti per il gameplay)
--      * circuito -> aggiunti data_gara e disputata
--                    rimossi i settori (settore_1/2/3, dettaglio non usato)
--      * gareggiare -> rimosso il riferimento al monoposto (nome_m)
--  - Aggiunte le tabelle applicative del fantasy:
--      * utente, fantateam, fantateam_pilota, scommessa
-- =======================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Drop (in ordine inverso di dipendenza, comprese le tabelle del dump precedente)
DROP TABLE IF EXISTS `scommessa`;
DROP TABLE IF EXISTS `fantateam_pilota`;
DROP TABLE IF EXISTS `fantateam`;
DROP TABLE IF EXISTS `utente`;
DROP TABLE IF EXISTS `penalita`;
DROP TABLE IF EXISTS `gareggiare`;
DROP TABLE IF EXISTS `monoposto`;
DROP TABLE IF EXISTS `pilota`;
DROP TABLE IF EXISTS `circuito`;
DROP TABLE IF EXISTS `motore`;
DROP TABLE IF EXISTS `scuderia`;
DROP TABLE IF EXISTS `citta`;

-- =======================================================================
-- TABELLE DI DOMINIO F1
-- =======================================================================

CREATE TABLE `citta` (
  citta VARCHAR(32) NOT NULL,
  paese VARCHAR(32) NOT NULL,
  PRIMARY KEY (`citta`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `scuderia` (
  nome VARCHAR(64) NOT NULL,
  anno_debutto INT NOT NULL,
  numero_titoli_costruttori INT DEFAULT 0,
  team_principal VARCHAR(64),
  PRIMARY KEY (`nome`),
  CONSTRAINT scuderia_anno_debutto_check CHECK (((anno_debutto >= 1950) AND (anno_debutto <= 2026))),
  CONSTRAINT scuderia_titoli_check CHECK ((numero_titoli_costruttori >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `circuito` (
  nome VARCHAR(64) NOT NULL,
  citta VARCHAR(32) NOT NULL,
  anno_debutto INT NOT NULL,
  numero_curve INT,
  data_gara DATE,                          -- data prevista del Gran Premio nella stagione corrente
  disputata CHAR(1) NOT NULL DEFAULT 'N',  -- 'Y' se la gara e' stata corsa, 'N' altrimenti
  pole_pilota INT DEFAULT NULL,            -- pilota che ha fatto la pole (per regolare le scommesse 'pole')
  PRIMARY KEY (`nome`),
  CONSTRAINT circuito_anno_debutto_check CHECK (((anno_debutto >= 1950) AND (anno_debutto <= 2026))),
  CONSTRAINT circuito_numero_curve_check CHECK ((numero_curve > 0)),
  CONSTRAINT circuito_disputata_check CHECK (disputata IN ('Y','N'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `pilota` (
  numero_pilota INT NOT NULL,
  numero_pole INT DEFAULT 0,
  numero_mondiali INT DEFAULT 0,
  nome VARCHAR(32) NOT NULL,
  secondo_nome VARCHAR(32) DEFAULT NULL,
  cognome VARCHAR(32) NOT NULL,
  data_nascita DATE,
  anno_debutto INT NOT NULL,
  nazionalita VARCHAR(32),
  ruolo VARCHAR(32) NOT NULL,
  scuderia_corrente VARCHAR(64),           -- scuderia per cui guida nella stagione corrente
  costo_fantasy INT NOT NULL DEFAULT 20,   -- costo in crediti per acquistarlo nel fantateam
  PRIMARY KEY (`numero_pilota`),
  CONSTRAINT pilota_anno_debutto_check CHECK (((anno_debutto >= 1950) AND (anno_debutto <= 2026))),
  CONSTRAINT pilota_numero_mondiali_check CHECK ((numero_mondiali >= 0)),
  CONSTRAINT pilota_numero_pilota_check CHECK (((numero_pilota >= 1) AND (numero_pilota <= 99))),
  CONSTRAINT pilota_numero_pole_check CHECK ((numero_pole >= 0)),
  CONSTRAINT pilota_ruolo_check CHECK ((ruolo IN ('Principale', 'Riserva'))),
  CONSTRAINT pilota_costo_check CHECK ((costo_fantasy >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `gareggiare` (
  numero_pilota INT NOT NULL,
  nome_c VARCHAR(64) NOT NULL,
  posizione_finale INT,
  numero_giri INT DEFAULT 0,
  punti_ottenuti INT DEFAULT 0,
  PRIMARY KEY (`numero_pilota`, `nome_c`),
  CONSTRAINT gareggiare_numero_giri_check CHECK ((numero_giri >= 0)),
  CONSTRAINT gareggiare_punti_ottenuti_check CHECK ((punti_ottenuti >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================================================
-- TABELLE APPLICATIVE F1 FANTASY
-- =======================================================================

CREATE TABLE `utente` (
  id_utente INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(40) NOT NULL,
  password VARCHAR(60) NOT NULL,           -- 60 caratteri: spazio per hash bcrypt
  email VARCHAR(100) NOT NULL,
  nome VARCHAR(50),
  cognome VARCHAR(50),
  data_registrazione DATETIME DEFAULT CURRENT_TIMESTAMP,
  crediti INT NOT NULL DEFAULT 1000,       -- crediti virtuali (per scommesse). Mai soldi reali.
  ruolo VARCHAR(16) NOT NULL DEFAULT 'giocatore',  -- 'admin' puo' chiudere gare e gestire il gioco
  cancellato CHAR(1) NOT NULL DEFAULT 'N',
  PRIMARY KEY (`id_utente`),
  UNIQUE KEY uk_utente_username (`username`),
  UNIQUE KEY uk_utente_email (`email`),
  CONSTRAINT utente_crediti_check CHECK (crediti >= 0),
  CONSTRAINT utente_ruolo_check CHECK (ruolo IN ('admin','giocatore')),
  CONSTRAINT utente_cancellato_check CHECK (cancellato IN ('Y','N'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `fantateam` (
  id_team INT NOT NULL AUTO_INCREMENT,
  id_utente INT NOT NULL,
  nome_team VARCHAR(50) NOT NULL,
  budget_residuo INT NOT NULL DEFAULT 100, -- budget separato per acquistare piloti
  punti_totali INT NOT NULL DEFAULT 0,     -- somma dei punti ottenuti dai piloti del team
  data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_team`),
  UNIQUE KEY uk_team_user_name (`id_utente`, `nome_team`),
  CONSTRAINT fantateam_budget_check CHECK (budget_residuo >= 0),
  CONSTRAINT fantateam_punti_check CHECK (punti_totali >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `fantateam_pilota` (
  id_team INT NOT NULL,
  numero_pilota INT NOT NULL,
  data_acquisto DATETIME DEFAULT CURRENT_TIMESTAMP,
  costo_pagato INT NOT NULL,
  PRIMARY KEY (`id_team`, `numero_pilota`),
  CONSTRAINT ftp_costo_check CHECK (costo_pagato >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `scommessa` (
  id_scommessa INT NOT NULL AUTO_INCREMENT,
  id_utente INT NOT NULL,
  nome_circuito VARCHAR(64) NOT NULL,
  numero_pilota INT NOT NULL,
  tipo_scommessa VARCHAR(20) NOT NULL,     -- 'vincitore' | 'podio' | 'pole'
  quota DOUBLE NOT NULL,                   -- moltiplicatore della vincita (es. 2.5)
  crediti_puntati INT NOT NULL,
  data_scommessa DATETIME DEFAULT CURRENT_TIMESTAMP,
  esito VARCHAR(20) NOT NULL DEFAULT 'in_attesa',  -- 'in_attesa' | 'vinta' | 'persa' | 'annullata'
  crediti_vinti INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_scommessa`),
  CONSTRAINT scommessa_tipo_check CHECK (tipo_scommessa IN ('vincitore','podio','pole')),
  CONSTRAINT scommessa_esito_check CHECK (esito IN ('in_attesa','vinta','persa','annullata')),
  CONSTRAINT scommessa_quota_check CHECK (quota >= 1.0),
  CONSTRAINT scommessa_puntati_check CHECK (crediti_puntati > 0),
  CONSTRAINT scommessa_vinti_check CHECK (crediti_vinti >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================================================
-- DATI DI ESEMPIO
-- =======================================================================

INSERT INTO `citta` (`citta`, `paese`) VALUES
('Melbourne', 'Australia'),
('Shanghai', 'Cina'),
('Suzuka', 'Giappone'),
('Sakhir', 'Bahrain'),
('Jeddah', 'Arabia Saudita'),
('Miami', 'Stati Uniti'),
('Imola', 'Italia'),
('Monaco', 'Monaco'),
('Barcellona', 'Spagna'),
('Montreal', 'Canada'),
('Spielberg', 'Austria'),
('Silverstone', 'Regno Unito'),
('Budapest', 'Ungheria'),
('Spa', 'Belgio'),
('Zandvoort', 'Paesi Bassi'),
('Monza', 'Italia'),
('Baku', 'Azerbaijan'),
('Singapore', 'Singapore'),
('Austin', 'Stati Uniti'),
('Citta del Messico', 'Messico'),
('San Paolo', 'Brasile'),
('Las Vegas', 'Stati Uniti'),
('Lusail', 'Qatar'),
('Abu Dhabi', 'Emirati Arabi Uniti');

INSERT INTO `scuderia` (`nome`, `anno_debutto`, `numero_titoli_costruttori`, `team_principal`) VALUES
('McLaren',         1966, 9,  'Andrea Stella'),
('Ferrari',         1950, 16, 'Frederic Vasseur'),
('Mercedes',        2010, 8,  'Toto Wolff'),
('Red Bull Racing', 2005, 6,  'Laurent Mekies'),
('Aston Martin',    2021, 0,  'Adrian Newey'),
('Alpine',          2021, 0,  'Oliver Oakes'),
('Williams',        1978, 9,  'James Vowles'),
('Racing Bulls',    2024, 0,  'Laurent Mekies'),
('Haas',            2016, 0,  'Ayao Komatsu'),
('Audi',            2026, 0,  'Jonathan Wheatley'),
('Cadillac',        2026, 0,  'Graeme Lowdon');

-- Calendario 2026. Stagione a meta' corso (oggi: 20 luglio 2026):
-- le prime 11 gare, da Melbourne a Spa, sono disputate ('Y');
-- la prossima e' l'Ungheria (26 luglio). Come nel calendario reale 2026,
-- Spa (19/7) precede Budapest (26/7).
INSERT INTO `circuito` (`nome`, `citta`, `anno_debutto`, `numero_curve`, `data_gara`, `disputata`) VALUES
('Formula 1 Rolex Australian Grand Prix',            'Melbourne',        1996, 16, '2026-03-08', 'Y'),
('Formula 1 Heineken Chinese Grand Prix',            'Shanghai',         2004, 16, '2026-03-22', 'Y'),
('Formula 1 MSC Cruises Japanese Grand Prix',        'Suzuka',           1987, 18, '2026-04-12', 'Y'),
('Formula 1 Crypto.com Miami Grand Prix',            'Miami',            2022, 19, '2026-05-03', 'Y'),
('Formula 1 MSC Cruises Gran Premio Made in Italy',  'Imola',            1980, 19, '2026-05-17', 'Y'),
('Formula 1 TAG Heuer Grand Prix de Monaco',         'Monaco',           1950, 19, '2026-05-24', 'Y'),
('Formula 1 AWS Spanish Grand Prix',                 'Barcellona',       1991, 16, '2026-06-07', 'Y'),
('Formula 1 AWS Canadian Grand Prix',                'Montreal',         1978, 14, '2026-06-14', 'Y'),
('Formula 1 Aramco Austrian Grand Prix',             'Spielberg',        1970, 10, '2026-06-28', 'Y'),
('Formula 1 Aramco British Grand Prix',              'Silverstone',      1950, 18, '2026-07-05', 'Y'),
('Formula 1 Belgian Grand Prix',                     'Spa',              1950, 19, '2026-07-19', 'Y'),
('Formula 1 Hungarian Grand Prix',                   'Budapest',         1986, 14, '2026-07-26', 'N'),
('Formula 1 Heineken Dutch Grand Prix',              'Zandvoort',        1952, 14, '2026-09-06', 'N'),
('Formula 1 Pirelli Italian Grand Prix',             'Monza',            1950, 11, '2026-09-13', 'N'),
('Formula 1 Azerbaijan Grand Prix',                  'Baku',             2017, 20, '2026-09-27', 'N'),
('Formula 1 Singapore Airlines Singapore Grand Prix','Singapore',        2008, 23, '2026-10-04', 'N'),
('Formula 1 Pirelli United States Grand Prix',       'Austin',           2012, 20, '2026-10-25', 'N'),
('Formula 1 Gran Premio de la Ciudad de Mexico',     'Citta del Messico',1963, 17, '2026-11-01', 'N'),
('Formula 1 MSC Cruises Grande Premio de Sao Paulo', 'San Paolo',        1973, 15, '2026-11-08', 'N'),
('Formula 1 Heineken Silver Las Vegas Grand Prix',   'Las Vegas',        2023, 17, '2026-11-21', 'N'),
('Formula 1 Qatar Airways Qatar Grand Prix',         'Lusail',           2021, 16, '2026-11-29', 'N'),
('Formula 1 Etihad Airways Abu Dhabi Grand Prix',    'Abu Dhabi',        2009, 16, '2026-12-06', 'N');

-- Pole position delle gare gia' disputate (per la verifica delle scommesse 'pole')
UPDATE `circuito` SET pole_pilota = 16 WHERE nome = 'Formula 1 Rolex Australian Grand Prix';
UPDATE `circuito` SET pole_pilota = 12 WHERE nome = 'Formula 1 Heineken Chinese Grand Prix';
UPDATE `circuito` SET pole_pilota = 3  WHERE nome = 'Formula 1 MSC Cruises Japanese Grand Prix';
UPDATE `circuito` SET pole_pilota = 3  WHERE nome = 'Formula 1 Crypto.com Miami Grand Prix';
UPDATE `circuito` SET pole_pilota = 16 WHERE nome = 'Formula 1 MSC Cruises Gran Premio Made in Italy';
UPDATE `circuito` SET pole_pilota = 16 WHERE nome = 'Formula 1 TAG Heuer Grand Prix de Monaco';
UPDATE `circuito` SET pole_pilota = 1  WHERE nome = 'Formula 1 AWS Spanish Grand Prix';
UPDATE `circuito` SET pole_pilota = 63 WHERE nome = 'Formula 1 AWS Canadian Grand Prix';
UPDATE `circuito` SET pole_pilota = 1  WHERE nome = 'Formula 1 Aramco Austrian Grand Prix';
UPDATE `circuito` SET pole_pilota = 44 WHERE nome = 'Formula 1 Aramco British Grand Prix';
UPDATE `circuito` SET pole_pilota = 1  WHERE nome = 'Formula 1 Belgian Grand Prix';

-- Piloti con scuderia corrente e costo fantasy.
-- Il costo riflette la competitivita stimata: top tier 30, mid 20, lower 10.
INSERT INTO `pilota` (`numero_pilota`, `numero_pole`, `numero_mondiali`, `nome`, `secondo_nome`, `cognome`, `data_nascita`, `anno_debutto`, `nazionalita`, `ruolo`, `scuderia_corrente`, `costo_fantasy`) VALUES
(1,  17,  1, 'Lando',     NULL,   'Norris',     '1999-11-13', 2019, 'Britannica',  'Principale', 'McLaren',         30),
(81, 4,   0, 'Oscar',     NULL,   'Piastri',    '2001-04-06', 2023, 'Australiana', 'Principale', 'McLaren',         28),
(16, 27,  0, 'Charles',   NULL,   'Leclerc',    '1997-10-16', 2018, 'Monegasca',   'Principale', 'Ferrari',         28),
(44, 104, 7, 'Lewis',     NULL,   'Hamilton',   '1985-01-07', 2007, 'Britannica',  'Principale', 'Ferrari',         30),
(63, 3,   0, 'George',    NULL,   'Russell',    '1998-02-15', 2019, 'Britannica',  'Principale', 'Mercedes',        26),
(12, 2,   0, 'Andrea',    'Kimi', 'Antonelli',  '2006-08-25', 2025, 'Italiana',    'Principale', 'Mercedes',        20),
(3,  40,  4, 'Max',       NULL,   'Verstappen', '1997-09-30', 2015, 'Olandese',    'Principale', 'Red Bull Racing', 32),
(6,  1,   0, 'Isack',     NULL,   'Hadjar',     '2004-02-04', 2025, 'Francese',    'Principale', 'Red Bull Racing', 14),
(14, 22,  2, 'Fernando',  NULL,   'Alonso',     '1981-07-29', 2001, 'Spagnola',    'Principale', 'Aston Martin',    18),
(18, 0,   0, 'Lance',     NULL,   'Stroll',     '1998-10-29', 2017, 'Canadese',    'Principale', 'Aston Martin',    12),
(10, 0,   0, 'Pierre',    NULL,   'Gasly',      '1996-02-07', 2017, 'Francese',    'Principale', 'Alpine',          16),
(43, 0,   0, 'Franco',    NULL,   'Colapinto',  '2003-07-27', 2024, 'Argentina',   'Principale', 'Alpine',          12),
(23, 0,   0, 'Alexander', NULL,   'Albon',      '1996-03-23', 2019, 'Thailandese', 'Principale', 'Williams',        16),
(55, 6,   0, 'Carlos',    NULL,   'Sainz',      '1994-09-01', 2015, 'Spagnola',    'Principale', 'Williams',        22),
(30, 0,   0, 'Liam',      NULL,   'Lawson',     '2002-02-11', 2023, 'Neozelandese','Principale', 'Racing Bulls',    14),
(41, 0,   0, 'Arvid',     NULL,   'Lindblad',   '2006-06-17', 2026, 'Britannica',  'Principale', 'Racing Bulls',    10),
(31, 0,   0, 'Esteban',   NULL,   'Ocon',       '1996-09-17', 2016, 'Francese',    'Principale', 'Haas',            14),
(87, 0,   0, 'Oliver',    NULL,   'Bearman',    '2005-05-08', 2024, 'Britannica',  'Principale', 'Haas',            12),
(27, 0,   0, 'Nico',      NULL,   'Hulkenberg', '1987-08-19', 2010, 'Tedesca',     'Principale', 'Audi',            14),
(5,  0,   0, 'Gabriel',   NULL,   'Bortoleto',  '2004-10-14', 2025, 'Brasiliana',  'Principale', 'Audi',            10),
(11, 3,   0, 'Sergio',    NULL,   'Perez',      '1990-01-26', 2011, 'Messicana',   'Principale', 'Cadillac',        14),
(77, 0,   0, 'Valtteri',  NULL,   'Bottas',     '1989-08-28', 2013, 'Finlandese',  'Principale', 'Cadillac',        12);

-- Risultati delle gare gia' disputate (Australia e Cina)
INSERT INTO `gareggiare` (`numero_pilota`, `nome_c`, `posizione_finale`, `numero_giri`, `punti_ottenuti`) VALUES
(63, 'Formula 1 Rolex Australian Grand Prix',  1,  58, 25),
(12, 'Formula 1 Rolex Australian Grand Prix',  2,  58, 18),
(16, 'Formula 1 Rolex Australian Grand Prix',  3,  58, 15),
(44, 'Formula 1 Rolex Australian Grand Prix',  4,  58, 12),
(1,  'Formula 1 Rolex Australian Grand Prix',  5,  58, 10),
(3,  'Formula 1 Rolex Australian Grand Prix',  6,  58, 8),
(87, 'Formula 1 Rolex Australian Grand Prix',  7,  58, 6),
(41, 'Formula 1 Rolex Australian Grand Prix',  8,  58, 4),
(5,  'Formula 1 Rolex Australian Grand Prix',  9,  58, 2),
(10, 'Formula 1 Rolex Australian Grand Prix', 10,  58, 1),
(12, 'Formula 1 Heineken Chinese Grand Prix',  1,  56, 25),
(44, 'Formula 1 Heineken Chinese Grand Prix',  2,  56, 18),
(16, 'Formula 1 Heineken Chinese Grand Prix',  3,  56, 15),
(63, 'Formula 1 Heineken Chinese Grand Prix',  4,  56, 12),
(3,  'Formula 1 Heineken Chinese Grand Prix',  5,  56, 10),
(1,  'Formula 1 Heineken Chinese Grand Prix',  6,  56, 8),
(81, 'Formula 1 Heineken Chinese Grand Prix',  7,  56, 6),
(14, 'Formula 1 Heineken Chinese Grand Prix',  8,  56, 4),
(55, 'Formula 1 Heineken Chinese Grand Prix',  9,  56, 2),
(10, 'Formula 1 Heineken Chinese Grand Prix', 10,  56, 1);

-- Gare 3-11: risultati della stagione fino a Spa (19 luglio 2026)
INSERT INTO `gareggiare` (`numero_pilota`, `nome_c`, `posizione_finale`, `numero_giri`, `punti_ottenuti`) VALUES
-- Suzuka (12/4): vince Verstappen, pole Verstappen
(3,  'Formula 1 MSC Cruises Japanese Grand Prix',  1, 53, 25),
(1,  'Formula 1 MSC Cruises Japanese Grand Prix',  2, 53, 18),
(16, 'Formula 1 MSC Cruises Japanese Grand Prix',  3, 53, 15),
(63, 'Formula 1 MSC Cruises Japanese Grand Prix',  4, 53, 12),
(81, 'Formula 1 MSC Cruises Japanese Grand Prix',  5, 53, 10),
(44, 'Formula 1 MSC Cruises Japanese Grand Prix',  6, 53, 8),
(12, 'Formula 1 MSC Cruises Japanese Grand Prix',  7, 53, 6),
(14, 'Formula 1 MSC Cruises Japanese Grand Prix',  8, 53, 4),
(55, 'Formula 1 MSC Cruises Japanese Grand Prix',  9, 53, 2),
(6,  'Formula 1 MSC Cruises Japanese Grand Prix', 10, 53, 1),
-- Miami (3/5): vince Norris, pole Verstappen
(1,  'Formula 1 Crypto.com Miami Grand Prix',  1, 57, 25),
(81, 'Formula 1 Crypto.com Miami Grand Prix',  2, 57, 18),
(3,  'Formula 1 Crypto.com Miami Grand Prix',  3, 57, 15),
(12, 'Formula 1 Crypto.com Miami Grand Prix',  4, 57, 12),
(63, 'Formula 1 Crypto.com Miami Grand Prix',  5, 57, 10),
(16, 'Formula 1 Crypto.com Miami Grand Prix',  6, 57, 8),
(44, 'Formula 1 Crypto.com Miami Grand Prix',  7, 57, 6),
(23, 'Formula 1 Crypto.com Miami Grand Prix',  8, 57, 4),
(10, 'Formula 1 Crypto.com Miami Grand Prix',  9, 57, 2),
(27, 'Formula 1 Crypto.com Miami Grand Prix', 10, 57, 1),
-- Imola (17/5): doppietta Ferrari, vince Leclerc, pole Leclerc
(16, 'Formula 1 MSC Cruises Gran Premio Made in Italy',  1, 63, 25),
(44, 'Formula 1 MSC Cruises Gran Premio Made in Italy',  2, 63, 18),
(1,  'Formula 1 MSC Cruises Gran Premio Made in Italy',  3, 63, 15),
(3,  'Formula 1 MSC Cruises Gran Premio Made in Italy',  4, 63, 12),
(12, 'Formula 1 MSC Cruises Gran Premio Made in Italy',  5, 63, 10),
(63, 'Formula 1 MSC Cruises Gran Premio Made in Italy',  6, 63, 8),
(81, 'Formula 1 MSC Cruises Gran Premio Made in Italy',  7, 63, 6),
(55, 'Formula 1 MSC Cruises Gran Premio Made in Italy',  8, 63, 4),
(5,  'Formula 1 MSC Cruises Gran Premio Made in Italy',  9, 63, 2),
(87, 'Formula 1 MSC Cruises Gran Premio Made in Italy', 10, 63, 1),
-- Monaco (24/5): vince Leclerc in casa, pole Leclerc
(16, 'Formula 1 TAG Heuer Grand Prix de Monaco',  1, 78, 25),
(1,  'Formula 1 TAG Heuer Grand Prix de Monaco',  2, 78, 18),
(3,  'Formula 1 TAG Heuer Grand Prix de Monaco',  3, 78, 15),
(81, 'Formula 1 TAG Heuer Grand Prix de Monaco',  4, 78, 12),
(23, 'Formula 1 TAG Heuer Grand Prix de Monaco',  5, 78, 10),
(44, 'Formula 1 TAG Heuer Grand Prix de Monaco',  6, 78, 8),
(63, 'Formula 1 TAG Heuer Grand Prix de Monaco',  7, 78, 6),
(6,  'Formula 1 TAG Heuer Grand Prix de Monaco',  8, 78, 4),
(14, 'Formula 1 TAG Heuer Grand Prix de Monaco',  9, 78, 2),
(30, 'Formula 1 TAG Heuer Grand Prix de Monaco', 10, 78, 1),
-- Barcellona (7/6): vince Piastri, pole Norris
(81, 'Formula 1 AWS Spanish Grand Prix',  1, 66, 25),
(1,  'Formula 1 AWS Spanish Grand Prix',  2, 66, 18),
(63, 'Formula 1 AWS Spanish Grand Prix',  3, 66, 15),
(16, 'Formula 1 AWS Spanish Grand Prix',  4, 66, 12),
(3,  'Formula 1 AWS Spanish Grand Prix',  5, 66, 10),
(12, 'Formula 1 AWS Spanish Grand Prix',  6, 66, 8),
(44, 'Formula 1 AWS Spanish Grand Prix',  7, 66, 6),
(14, 'Formula 1 AWS Spanish Grand Prix',  8, 66, 4),
(10, 'Formula 1 AWS Spanish Grand Prix',  9, 66, 2),
(55, 'Formula 1 AWS Spanish Grand Prix', 10, 66, 1),
-- Montreal (14/6): vince Verstappen, pole Russell
(3,  'Formula 1 AWS Canadian Grand Prix',  1, 70, 25),
(63, 'Formula 1 AWS Canadian Grand Prix',  2, 70, 18),
(12, 'Formula 1 AWS Canadian Grand Prix',  3, 70, 15),
(44, 'Formula 1 AWS Canadian Grand Prix',  4, 70, 12),
(16, 'Formula 1 AWS Canadian Grand Prix',  5, 70, 10),
(81, 'Formula 1 AWS Canadian Grand Prix',  6, 70, 8),
(1,  'Formula 1 AWS Canadian Grand Prix',  7, 70, 6),
(23, 'Formula 1 AWS Canadian Grand Prix',  8, 70, 4),
(31, 'Formula 1 AWS Canadian Grand Prix',  9, 70, 2),
(27, 'Formula 1 AWS Canadian Grand Prix', 10, 70, 1),
-- Spielberg (28/6): vince Norris, pole Norris
(1,  'Formula 1 Aramco Austrian Grand Prix',  1, 71, 25),
(3,  'Formula 1 Aramco Austrian Grand Prix',  2, 71, 18),
(81, 'Formula 1 Aramco Austrian Grand Prix',  3, 71, 15),
(16, 'Formula 1 Aramco Austrian Grand Prix',  4, 71, 12),
(63, 'Formula 1 Aramco Austrian Grand Prix',  5, 71, 10),
(12, 'Formula 1 Aramco Austrian Grand Prix',  6, 71, 8),
(44, 'Formula 1 Aramco Austrian Grand Prix',  7, 71, 6),
(10, 'Formula 1 Aramco Austrian Grand Prix',  8, 71, 4),
(30, 'Formula 1 Aramco Austrian Grand Prix',  9, 71, 2),
(41, 'Formula 1 Aramco Austrian Grand Prix', 10, 71, 1),
-- Silverstone (5/7): vince Hamilton in casa, pole Hamilton
(44, 'Formula 1 Aramco British Grand Prix',  1, 52, 25),
(1,  'Formula 1 Aramco British Grand Prix',  2, 52, 18),
(63, 'Formula 1 Aramco British Grand Prix',  3, 52, 15),
(3,  'Formula 1 Aramco British Grand Prix',  4, 52, 12),
(16, 'Formula 1 Aramco British Grand Prix',  5, 52, 10),
(81, 'Formula 1 Aramco British Grand Prix',  6, 52, 8),
(12, 'Formula 1 Aramco British Grand Prix',  7, 52, 6),
(87, 'Formula 1 Aramco British Grand Prix',  8, 52, 4),
(23, 'Formula 1 Aramco British Grand Prix',  9, 52, 2),
(55, 'Formula 1 Aramco British Grand Prix', 10, 52, 1),
-- Spa (19/7): vince Verstappen, pole Norris
(3,  'Formula 1 Belgian Grand Prix',  1, 44, 25),
(1,  'Formula 1 Belgian Grand Prix',  2, 44, 18),
(16, 'Formula 1 Belgian Grand Prix',  3, 44, 15),
(12, 'Formula 1 Belgian Grand Prix',  4, 44, 12),
(81, 'Formula 1 Belgian Grand Prix',  5, 44, 10),
(63, 'Formula 1 Belgian Grand Prix',  6, 44, 8),
(44, 'Formula 1 Belgian Grand Prix',  7, 44, 6),
(14, 'Formula 1 Belgian Grand Prix',  8, 44, 4),
(10, 'Formula 1 Belgian Grand Prix',  9, 44, 2),
(5,  'Formula 1 Belgian Grand Prix', 10, 44, 1);

-- Utenti di prova. Le password sono hash bcrypt (mai in chiaro nel DB).
-- Credenziali per il login di test:
--   admin  / admin123
--   mario  / mario123
--   giulia / giulia123
-- Saldi coerenti con lo storico scommesse qui sotto:
--   mario:  1000 iniziali - 50 puntati sull'Ungheria (in attesa)        = 950
--   giulia: 1400 iniziali + 125 vinti a Suzuka - 100 puntati Ungheria   = 1425
INSERT INTO `utente` (`username`, `password`, `email`, `nome`, `cognome`, `crediti`, `ruolo`) VALUES
('admin',  '$2a$10$0ShnBaHQPEaXZirUipcsee9L26b9Lei7zukNl66pJj8mtX6Y0vRSm', 'admin@f1fantasy.test', 'Admin',  'F1Fantasy', 9999, 'admin'),
('mario',  '$2a$10$.wCvThZwyu6sw0Aq02r1buGbupaXOy2ln7/ASoLlJYc.9XytzbHXW', 'mario@example.com',    'Mario',  'Rossi',      950, 'giocatore'),
('giulia', '$2a$10$2alYjZHD10wn7rORah4AJu1k9LPuLGNi2.Fdvd9NiYVUbt56xu/KG', 'giulia@example.com',   'Giulia', 'Bianchi',   1425, 'giocatore');

-- Un fantateam d'esempio per l'utente "mario".
-- punti_totali = somma punti dei suoi piloti nelle 11 gare disputate:
--   Norris 179 + Leclerc 162 + Russell 139 = 480
INSERT INTO `fantateam` (`id_utente`, `nome_team`, `budget_residuo`, `punti_totali`) VALUES
(2, 'Scuderia Rossi', 16, 480);

-- Piloti scelti nel fantateam (rispettando il budget di 100 crediti)
-- Norris(30) + Leclerc(28) + Russell(26) = 84 spesi, 16 residui
INSERT INTO `fantateam_pilota` (`id_team`, `numero_pilota`, `costo_pagato`) VALUES
(1, 1,  30),  -- Norris
(1, 16, 28),  -- Leclerc
(1, 63, 26);  -- Russell

-- Scommesse d'esempio. Le quote seguono la formula del server
-- (services/quota.js: base = 40/costo_fantasy, limitata a 1.2-5.0;
--  vincitore = base, podio = base*0.55 min 1.1, pole = base*0.8 min 1.15):
--   1. mario  su Russell vincitore in Australia  (40/26=1.54) -> VINTA:  50*1.54 = 77
--   2. mario  su Leclerc podio in Cina           (max(1.1, 1.43*0.55))   -> VINTA: 30*1.10 = 33
--   3. giulia su Verstappen vincitore a Suzuka   (40/32=1.25) -> VINTA: 100*1.25 = 125
--   4. giulia su Norris pole a Miami (pole: Verstappen)       -> PERSA
--   5. mario  su Norris vincitore in Ungheria    (40/30=1.33) -> IN ATTESA
--   6. giulia su Antonelli podio in Ungheria     (max(1.1, 2.0*0.55))    -> IN ATTESA
INSERT INTO `scommessa` (`id_utente`, `nome_circuito`, `numero_pilota`, `tipo_scommessa`, `quota`, `crediti_puntati`, `esito`, `crediti_vinti`) VALUES
(2, 'Formula 1 Rolex Australian Grand Prix',     63, 'vincitore', 1.54,  50, 'vinta',     77),
(2, 'Formula 1 Heineken Chinese Grand Prix',     16, 'podio',     1.10,  30, 'vinta',     33),
(3, 'Formula 1 MSC Cruises Japanese Grand Prix',  3, 'vincitore', 1.25, 100, 'vinta',    125),
(3, 'Formula 1 Crypto.com Miami Grand Prix',      1, 'pole',      1.15,  40, 'persa',      0),
(2, 'Formula 1 Hungarian Grand Prix',             1, 'vincitore', 1.33,  50, 'in_attesa',  0),
(3, 'Formula 1 Hungarian Grand Prix',            12, 'podio',     1.10, 100, 'in_attesa',  0);

-- =======================================================================
-- DATI AGGIUNTIVI: altri giocatori, fantateam e scommesse
-- Popolano le classifiche e la competizione fra fantateam.
-- Coerenti con i risultati reali gia in `gareggiare` (11 gare, Melbourne->Spa);
-- l'Ungheria resta l'unica gara con scommesse 'in_attesa' (nessun punto da li').
-- Password bcrypt: ogni utente ha password <username>123.
-- Saldi crediti = 1000 iniziali - somma puntate + somma vincite lorde,
--   con vincita = ROUND(puntata*quota) e quota da services/quota.js.
-- =======================================================================

-- 6 nuovi giocatori (id 4..9)
INSERT INTO `utente` (`id_utente`, `username`, `password`, `email`, `nome`, `cognome`, `crediti`, `ruolo`) VALUES
(4, 'luca',   '$2a$10$49ME0DylWNBszcfNydu5yOETcul4/685HhM8I74Bggs67ZFFlVNI6', 'luca@example.com',   'Luca',   'Moretti',  981, 'giocatore'),
(5, 'sara',   '$2a$10$4YgJeg/B/waQSy6RmsZvHeCKLVcDVwPQlaW4jkxXJUNY4BgzCDBNG', 'sara@example.com',   'Sara',   'Conti',    920, 'giocatore'),
(6, 'marco',  '$2a$10$SpgQEXKWtefD9u9W4irlXOBan37EzeDsPGf6TWgBs24mN//h7YOky', 'marco@example.com',  'Marco',  'Esposito', 932, 'giocatore'),
(7, 'elena',  '$2a$10$K71aXnGlQqBbesbrfDdaoOMh9c2IyZcEajGkB91QC/YnBvaAVimTm', 'elena@example.com',  'Elena',  'Ricci',    941, 'giocatore'),
(8, 'davide', '$2a$10$TMxKWqXOCCoCLwjJHVH9GOvr5BudI0AYaMXCOAPCc9KXLIiPyYzxy', 'davide@example.com', 'Davide', 'Greco',    959, 'giocatore'),
(9, 'chiara', '$2a$10$fEk3KNASs05ke9bGxgYS0.9q7mnWWj.ZmSJ5MWdfM/vlsSuCpf2ge', 'chiara@example.com', 'Chiara', 'Marini',   955, 'giocatore');

-- Fantateam (id 2..9). budget_residuo = 100 - costo rosa; punti_totali = somma punti piloti nelle 11 gare.
INSERT INTO `fantateam` (`id_team`, `id_utente`, `nome_team`, `budget_residuo`, `punti_totali`) VALUES
(2, 4, 'Orange Army',         16, 436),
(3, 4, 'Prancing Horse',      22, 407),
(4, 5, 'Max Power',           18, 474),
(5, 6, 'Podio Sicuro',        14, 476),
(6, 6, 'Outsiders',            8, 281),
(7, 7, 'Regina del Circuito',  6, 342),
(8, 8, 'Silver Arrows',       22, 434),
(9, 9, 'Cavallino e Stella',  14, 405);

-- Rose dei fantateam (costo_pagato = costo_fantasy del pilota)
INSERT INTO `fantateam_pilota` (`id_team`, `numero_pilota`, `costo_pagato`) VALUES
(2, 1, 30), (2, 81, 28), (2, 63, 26),
(3, 16, 28), (3, 44, 30), (3, 12, 20),
(4, 3, 32), (4, 1, 30), (4, 12, 20),
(5, 3, 32), (5, 16, 28), (5, 63, 26),
(6, 81, 28), (6, 44, 30), (6, 23, 16), (6, 14, 18),
(7, 1, 30), (7, 12, 20), (7, 23, 16), (7, 10, 16), (7, 87, 12),
(8, 63, 26), (8, 12, 20), (8, 3, 32),
(9, 16, 28), (9, 44, 30), (9, 81, 28);

-- Scommesse: esiti coerenti coi risultati reali; quota da services/quota.js;
-- crediti_vinti = ROUND(puntata*quota) per le vinte, 0 per persa/in_attesa.
INSERT INTO `scommessa` (`id_utente`, `nome_circuito`, `numero_pilota`, `tipo_scommessa`, `quota`, `crediti_puntati`, `esito`, `crediti_vinti`) VALUES
-- luca (id 4)
(4, 'Formula 1 MSC Cruises Japanese Grand Prix',       3, 'vincitore', 1.25, 100, 'vinta',     125),
(4, 'Formula 1 Aramco British Grand Prix',             1, 'podio',     1.10,  60, 'vinta',      66),
(4, 'Formula 1 Hungarian Grand Prix',                  1, 'vincitore', 1.33,  50, 'in_attesa',   0),
-- sara (id 5)
(5, 'Formula 1 AWS Canadian Grand Prix',               3, 'vincitore', 1.25,  80, 'vinta',     100),
(5, 'Formula 1 Crypto.com Miami Grand Prix',           1, 'pole',      1.15,  40, 'persa',       0),
(5, 'Formula 1 Hungarian Grand Prix',                 12, 'podio',     1.10,  60, 'in_attesa',   0),
-- marco (id 6)
(6, 'Formula 1 MSC Cruises Gran Premio Made in Italy', 16, 'vincitore', 1.43,  70, 'vinta',     100),
(6, 'Formula 1 TAG Heuer Grand Prix de Monaco',        16, 'vincitore', 1.43,  50, 'vinta',      72),
(6, 'Formula 1 Aramco Austrian Grand Prix',            81, 'vincitore', 1.43,  40, 'persa',       0),
(6, 'Formula 1 Hungarian Grand Prix',                   3, 'vincitore', 1.25,  80, 'in_attesa',   0),
-- elena (id 7)
(7, 'Formula 1 AWS Spanish Grand Prix',                81, 'vincitore', 1.43,  60, 'vinta',      86),
(7, 'Formula 1 Rolex Australian Grand Prix',           16, 'podio',     1.10,  50, 'vinta',      55),
(7, 'Formula 1 Aramco British Grand Prix',              3, 'vincitore', 1.25,  40, 'persa',       0),
(7, 'Formula 1 Hungarian Grand Prix',                  16, 'podio',     1.10,  50, 'in_attesa',   0),
-- davide (id 8)
(8, 'Formula 1 Belgian Grand Prix',                     3, 'vincitore', 1.25, 100, 'vinta',     125),
(8, 'Formula 1 AWS Canadian Grand Prix',               63, 'podio',     1.10,  40, 'vinta',      44),
(8, 'Formula 1 Hungarian Grand Prix',                   3, 'vincitore', 1.25,  70, 'in_attesa',   0),
-- chiara (id 9)
(9, 'Formula 1 MSC Cruises Gran Premio Made in Italy', 44, 'podio',     1.10,  50, 'vinta',      55),
(9, 'Formula 1 Aramco British Grand Prix',             44, 'vincitore', 1.33,  60, 'vinta',      80),
(9, 'Formula 1 TAG Heuer Grand Prix de Monaco',        81, 'pole',      1.15,  30, 'persa',       0),
(9, 'Formula 1 Hungarian Grand Prix',                  16, 'vincitore', 1.43,  40, 'in_attesa',   0);

-- =======================================================================
-- VINCOLI DI CHIAVE ESTERNA
-- =======================================================================

ALTER TABLE `circuito`
  ADD CONSTRAINT `circuito_citta_fkey`
  FOREIGN KEY (`citta`) REFERENCES `citta` (`citta`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `circuito`
  ADD CONSTRAINT `circuito_pole_fkey`
  FOREIGN KEY (`pole_pilota`) REFERENCES `pilota` (`numero_pilota`)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE `pilota`
  ADD CONSTRAINT `pilota_scuderia_fkey`
  FOREIGN KEY (`scuderia_corrente`) REFERENCES `scuderia` (`nome`)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE `gareggiare`
  ADD CONSTRAINT `gareggiare_nome_c_fkey`
  FOREIGN KEY (`nome_c`) REFERENCES `circuito` (`nome`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `gareggiare`
  ADD CONSTRAINT `gareggiare_numero_pilota_fkey`
  FOREIGN KEY (`numero_pilota`) REFERENCES `pilota` (`numero_pilota`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `fantateam`
  ADD CONSTRAINT `fantateam_utente_fkey`
  FOREIGN KEY (`id_utente`) REFERENCES `utente` (`id_utente`)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `fantateam_pilota`
  ADD CONSTRAINT `ftp_team_fkey`
  FOREIGN KEY (`id_team`) REFERENCES `fantateam` (`id_team`)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `fantateam_pilota`
  ADD CONSTRAINT `ftp_pilota_fkey`
  FOREIGN KEY (`numero_pilota`) REFERENCES `pilota` (`numero_pilota`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `scommessa`
  ADD CONSTRAINT `scommessa_utente_fkey`
  FOREIGN KEY (`id_utente`) REFERENCES `utente` (`id_utente`)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `scommessa`
  ADD CONSTRAINT `scommessa_circuito_fkey`
  FOREIGN KEY (`nome_circuito`) REFERENCES `circuito` (`nome`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `scommessa`
  ADD CONSTRAINT `scommessa_pilota_fkey`
  FOREIGN KEY (`numero_pilota`) REFERENCES `pilota` (`numero_pilota`)
  ON UPDATE CASCADE ON DELETE RESTRICT;

-- =======================================================================
-- INDICI UTILI per le query del fantasy
-- =======================================================================

CREATE INDEX idx_pilota_scuderia ON `pilota` (`scuderia_corrente`);
CREATE INDEX idx_gareggiare_circuito ON `gareggiare` (`nome_c`);
CREATE INDEX idx_circuito_data ON `circuito` (`data_gara`);
CREATE INDEX idx_scommessa_utente ON `scommessa` (`id_utente`);
CREATE INDEX idx_scommessa_circuito ON `scommessa` (`nome_circuito`);
CREATE INDEX idx_scommessa_esito ON `scommessa` (`esito`);
CREATE INDEX idx_fantateam_utente ON `fantateam` (`id_utente`);

SET FOREIGN_KEY_CHECKS = 1;
