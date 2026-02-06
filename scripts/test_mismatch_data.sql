-- Testdaten: Abweichungen zwischen Rechnung und Bestellung erzeugen
-- Ausführen im Supabase SQL-Editor nach der Migration

-- Gesamtwert der Bestellung abweichend setzen (Rechnung: 61,24 €)
UPDATE bestellungen SET gesamtwert = '62,24 €' WHERE bestellnummer = '619994';

-- Bestelldatum abweichend setzen (Rechnung: 22.01.2026)
UPDATE bestellungen SET datum = '20.01.2026' WHERE bestellnummer = '619994';

-- Lieferadresse leicht abweichend setzen (PLZ anders)
UPDATE bestellungen SET lieferadresse = 'Uwe Will, Nördliche Hauptstraße 21, 61138 Schöneck' WHERE bestellnummer = '619994';

-- Rückgängig machen (bei Bedarf):
-- UPDATE bestellungen SET gesamtwert = '61,24 €', datum = '22.01.2026', lieferadresse = 'Uwe Will, Nördliche Hauptstraße 21, 61137 Schöneck' WHERE bestellnummer = '619994';
