function DetailView({ invoice, loading }) {
  if (loading) {
    return (
      <div className="detail-view">
        <div className="detail-header">Rechnungsdetails</div>
        <div className="detail-content">
          <div className="loading">
            <div className="loading-spinner"></div>
            Loading...
          </div>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="detail-view">
        <div className="detail-header">Rechnungsdetails</div>
        <div className="detail-content">
          <div className="detail-placeholder">
            Wählen Sie eine Rechnung aus der Liste
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="detail-view">
      <div className="detail-header">
        Rechnung {invoice.nummer || `#${invoice.id}`}
      </div>
      <div className="detail-content">
        <div className="detail-grid">
          <Field label="Rechnungsnummer" value={invoice.nummer} />
          <Field label="Datum" value={invoice.datum} />
          <Field label="Gesamtpreis" value={invoice.gesamtpreis} isAmount />

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

export default DetailView
