DROP TABLE IF EXISTS trades;
DROP TABLE IF EXISTS opportunities;
DROP TABLE IF EXISTS exchanges;
DROP TABLE IF EXISTS snapshots;

CREATE TABLE IF NOT EXISTS exchanges (
  id integer PRIMARY KEY,
  name text NOT NULL,
  data json,
  updated timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opportunities (
  id serial PRIMARY KEY,
  exchange_id integer REFERENCES exchanges(id),
  sequence text NOT NULL,
  arbitrage text NOT NULL,
  maximum text NOT NULL,
  potential text NOT NULL,
  amount text NOT NULL,
  updated timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trades (
  id serial PRIMARY KEY,
  exchange_id integer REFERENCES exchanges(id),
  opportunity_id integer REFERENCES opportunities(id),
  seq integer,
  expected text NOT NULL,
  received text,
  order_identity text,
  details json,
  placed json,
  result json,
  completed boolean NOT NULL DEFAULT false,
  updated timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS snapshots (
  id serial PRIMARY KEY,
  exchange_id integer REFERENCES exchanges(id),
  accounts json,
  taken timestamp NOT NULL DEFAULT now()
);

INSERT INTO exchanges (id, name) VALUES (1, 'GDAX');
INSERT INTO exchanges (id, name) VALUES (2, 'CEX');
INSERT INTO exchanges (id, name) VALUES (3, 'Binance');
