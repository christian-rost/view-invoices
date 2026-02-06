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
            <Field label="Datum" value={invoice.datum} />
            <Field label="Gesamtpreis" value={invoice.gesamtpreis} isAmount />
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
                  <span className="detail-label">Leistungen</span>
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
                      {invoice.leistungen.map((leistung) => (
                        <tr key={leistung.id}>
                          <td>{leistung.bezeichnung || '-'}</td>
                          <td className="center">{leistung.menge || '-'}</td>
                          <td className="right">{leistung.wert || '-'}</td>
                        </tr>
                      ))}
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
              <Field label="Datum" value={invoice.bestellung.datum} />
              <Field label="Status" value={<StatusBadge status={invoice.bestellung.status} />} />
              <Field label="Gesamtwert" value={invoice.bestellung.gesamtwert} isAmount />

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
                    <span className="detail-label">Bestellpositionen</span>
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
                        {invoice.bestellung.positionen.map((pos) => (
                          <tr key={pos.id}>
                            <td>{pos.bezeichnung || '-'}</td>
                            <td className="center">{pos.menge || '-'}</td>
                            <td className="right">{pos.einzelpreis || '-'}</td>
                          </tr>
                        ))}
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

function Field({ label, value, fullWidth = false, isAmount = false }) {
  return (
    <div className={`detail-field ${fullWidth ? 'full-width' : ''}`}>
      <span className="detail-label">{label}</span>
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
