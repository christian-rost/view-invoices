function normalize(str) {
  if (!str) return ''
  return str.toLowerCase().replace(/[,\n\r]/g, ' ').replace(/\s+/g, ' ').trim()
}

function valuesMatch(a, b) {
  if (!a && !b) return true
  if (!a || !b) return false
  return normalize(a) === normalize(b)
}

function DetailView({ invoice, loading }) {
  if (loading) {
    return (
      <div className="detail-container">
        <div className="detail-view">
          <div className="detail-header">Rechnungsdetails</div>
          <div className="detail-content">
            <div className="loading">
              <div className="loading-spinner"></div>
              Loading...
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="detail-container">
        <div className="detail-view">
          <div className="detail-header">Rechnungsdetails</div>
          <div className="detail-content">
            <div className="detail-placeholder">
              Wählen Sie eine Rechnung aus der Liste
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Abweichungen zwischen Rechnung und Bestellung berechnen
  const m = {}
  if (invoice.bestellung) {
    const b = invoice.bestellung

    if (!valuesMatch(invoice.gesamtpreis, b.gesamtwert)) {
      m.gesamtpreis = true
      m.gesamtwert = true
    }
    if (!valuesMatch(invoice.datum, b.datum)) {
      m.rechnungDatum = true
      m.bestellungDatum = true
    }

    // Positionen vergleichen (Leistungen ↔ Bestellpositionen)
    const leistungen = invoice.leistungen || []
    const positionen = b.positionen || []
    m.leistungen = {}
    m.positionen = {}

    if (leistungen.length !== positionen.length) {
      m.positionCount = true
    }

    const maxLen = Math.max(leistungen.length, positionen.length)
    for (let i = 0; i < maxLen; i++) {
      const l = leistungen[i]
      const p = positionen[i]

      if (!l || !p) {
        // Überzählige Position auf einer Seite
        if (l) m.leistungen[i] = { bezeichnung: true, menge: true, wert: true }
        if (p) m.positionen[i] = { bezeichnung: true, menge: true, einzelpreis: true }
        continue
      }

      const lm = {}
      const pm = {}
      if (!valuesMatch(l.bezeichnung, p.bezeichnung)) { lm.bezeichnung = true; pm.bezeichnung = true }
      if (!valuesMatch(l.menge, p.menge)) { lm.menge = true; pm.menge = true }
      if (!valuesMatch(l.wert, p.einzelpreis)) { lm.wert = true; pm.einzelpreis = true }

      if (Object.keys(lm).length) m.leistungen[i] = lm
      if (Object.keys(pm).length) m.positionen[i] = pm
    }
  }

  return (
    <div className="detail-container">
      {/* Rechnungsdetails */}
      <div className="detail-view">
        <div className="detail-header">
          Rechnung {invoice.nummer || `#${invoice.id}`}
        </div>
        <div className="detail-content">
          <div className="detail-grid">
            <Field label="Rechnungsnummer" value={invoice.nummer} />
            <Field label="Datum" value={invoice.datum} mismatch={m.rechnungDatum} />
            <Field label="Gesamtpreis" value={invoice.gesamtpreis} isAmount mismatch={m.gesamtpreis} />
            <Field label="Bestellnummer" value={invoice.bestellnummer} />

            <div className="detail-field full-width" style={{ borderTop: '1px solid var(--color-gray)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <span className="detail-label">Leistungserbringer</span>
            </div>
            <Field label="Name" value={invoice.erbringer_name} />
            <Field label="Anschrift" value={invoice.erbringer_anschrift} fullWidth />
            <Field label="Steuernummer" value={invoice.erbringer_steuernummer} />
            <Field label="USt-IdNr." value={invoice.erbringer_umsatzsteuer} />

            <div className="detail-field full-width" style={{ borderTop: '1px solid var(--color-gray)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <span className="detail-label">Leistungsempfänger</span>
            </div>
            <Field label="Name" value={invoice.empfaenger_name} />
            <Field label="Anschrift" value={invoice.empfaenger_anschrift} fullWidth />

            {invoice.leistungen && invoice.leistungen.length > 0 && (
              <>
                <div className="detail-field full-width" style={{ borderTop: '1px solid var(--color-gray)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <span className="detail-label">
                    {m.positionCount && <span className="mismatch-icon" title="Unterschiedliche Anzahl Positionen">⚠</span>}
                    Leistungen
                  </span>
                </div>
                <div className="detail-field full-width">
                  <table className="leistungen-table">
                    <thead>
                      <tr>
                        <th>Bezeichnung</th>
                        <th>Menge</th>
                        <th>Wert</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.leistungen.map((leistung, i) => {
                        const rm = m.leistungen?.[i] || {}
                        return (
                          <tr key={leistung.id}>
                            <td className={rm.bezeichnung ? 'cell-mismatch' : ''}>{leistung.bezeichnung || '-'}</td>
                            <td className={`center ${rm.menge ? 'cell-mismatch' : ''}`}>{leistung.menge || '-'}</td>
                            <td className={`right ${rm.wert ? 'cell-mismatch' : ''}`}>{leistung.wert || '-'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bestellungsdetails */}
      <div className="detail-view">
        <div className="detail-header">
          Bestellung {invoice.bestellung?.bestellnummer || invoice.bestellnummer || '-'}
        </div>
        <div className="detail-content">
          {invoice.bestellung ? (
            <div className="detail-grid">
              <Field label="Bestellnummer" value={invoice.bestellung.bestellnummer} />
              <Field label="Datum" value={invoice.bestellung.datum} mismatch={m.bestellungDatum} />
              <Field label="Status" value={<StatusBadge status={invoice.bestellung.status} />} />
              <Field label="Gesamtwert" value={invoice.bestellung.gesamtwert} isAmount mismatch={m.gesamtwert} />

              <div className="detail-field full-width" style={{ borderTop: '1px solid var(--color-gray)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <span className="detail-label">Adressen</span>
              </div>
              <Field label="Lieferadresse" value={invoice.bestellung.lieferadresse} fullWidth />
              <Field label="Rechnungsadresse" value={invoice.bestellung.rechnungsadresse} fullWidth />

              <div className="detail-field full-width" style={{ borderTop: '1px solid var(--color-gray)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <span className="detail-label">Versand & Kosten</span>
              </div>
              <Field label="Versandart" value={invoice.bestellung.versandart} />
              <Field label="Versandkosten" value={invoice.bestellung.versandkosten} isAmount />
              <Field label="Zwischensumme" value={invoice.bestellung.zwischensumme} isAmount />
              <Field label="Rabatt" value={invoice.bestellung.rabatt} isAmount />
              <Field label="MwSt." value={invoice.bestellung.mwst} isAmount />

              {invoice.bestellung.positionen && invoice.bestellung.positionen.length > 0 && (
                <>
                  <div className="detail-field full-width" style={{ borderTop: '1px solid var(--color-gray)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                    <span className="detail-label">
                      {m.positionCount && <span className="mismatch-icon" title="Unterschiedliche Anzahl Positionen">⚠</span>}
                      Bestellpositionen
                    </span>
                  </div>
                  <div className="detail-field full-width">
                    <table className="leistungen-table">
                      <thead>
                        <tr>
                          <th>Bezeichnung</th>
                          <th>Menge</th>
                          <th>Einzelpreis</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.bestellung.positionen.map((pos, i) => {
                          const pm = m.positionen?.[i] || {}
                          return (
                            <tr key={pos.id}>
                              <td className={pm.bezeichnung ? 'cell-mismatch' : ''}>{pos.bezeichnung || '-'}</td>
                              <td className={`center ${pm.menge ? 'cell-mismatch' : ''}`}>{pos.menge || '-'}</td>
                              <td className={`right ${pm.einzelpreis ? 'cell-mismatch' : ''}`}>{pos.einzelpreis || '-'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="detail-placeholder">
              {invoice.bestellnummer
                ? 'Bestellung nicht gefunden'
                : 'Keine Bestellung verknüpft'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, fullWidth = false, isAmount = false, mismatch = false }) {
  return (
    <div className={`detail-field ${fullWidth ? 'full-width' : ''} ${mismatch ? 'mismatch' : ''}`}>
      <span className="detail-label">
        {mismatch && <span className="mismatch-icon" title="Abweichung zwischen Rechnung und Bestellung">⚠</span>}
        {label}
      </span>
      <span className={`detail-value ${isAmount ? 'amount' : ''}`}>
        {value || '-'}
      </span>
    </div>
  )
}

function StatusBadge({ status }) {
  if (!status) return '-'

  const statusMap = {
    'completed': 'paid',
    'abgeschlossen': 'paid',
    'shipped': 'paid',
    'versendet': 'paid',
    'pending': 'pending',
    'offen': 'pending',
    'processing': 'pending',
    'in bearbeitung': 'pending',
    'bestätigt': 'pending',
    'cancelled': 'overdue',
    'storniert': 'overdue'
  }

  const className = statusMap[status.toLowerCase()] || 'pending'

  return (
    <span className={`status-badge ${className}`}>
      {status}
    </span>
  )
}

export default DetailView
