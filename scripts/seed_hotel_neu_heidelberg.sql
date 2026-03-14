-- Buchungsbestätigung: Hotel Neu Heidelberg (Buchungsnummer 90653064)
-- Verknüpft mit Rechnung Nr. 100685
-- Ausführen in Supabase SQL Editor

-- 1. Bestellung einfügen
INSERT INTO bestellungen (
  bestellnummer,
  datum,
  status,
  lieferadresse,
  rechnungsadresse,
  versandart,
  versandkosten,
  rabatt,
  mwst,
  zwischensumme,
  gesamtwert
) VALUES (
  '90653064',
  '18.11.2025',
  'bestätigt',
  'Hotel Neu Heidelberg, Kranichweg 13-15, 69123 Heidelberg',
  'Christian Rost, Kurpfalzring 110/1, 69123 Heidelberg',
  null,
  null,
  null,
  null,
  '81,10 €',
  '81,10 €'
);

-- 2. Bestellposition einfügen
INSERT INTO bestellpositionen (
  bestellnummer,
  bezeichnung,
  menge,
  einzelpreis
) VALUES (
  '90653064',
  'Hotelzimmer "Superior" im WohlfühlHotel (Do 04.12.2025 – Fr 05.12.2025, 1 Erwachsener, 1 Nacht)',
  '1',
  '81,10 €'
);

-- 3. Rechnung 100685 mit Bestellung verknüpfen
UPDATE rechnungen
SET bestellnummer = '90653064'
WHERE nummer = '100685';
