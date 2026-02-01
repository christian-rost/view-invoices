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
          <Field label="Datum" value={formatDate(invoice.datum)} />
          <Field label="Status" value={<StatusBadge status={invoice.status} />} />
          <Field label="Zahlungsziel" value={formatDate(invoice.zahlungsziel)} />

          <div className="detail-field full-width" style={{ borderTop: '1px solid var(--color-gray)', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <span className="detail-label">Leistungserbringer</span>
          </div>
          <Field label="Name" value={invoice.erbringer_name} />
          <Field label="Anschrift" value={invoice.erbringer_anschrift} />
          <Field label="Steuernummer" value={invoice.erbringer_steuernummer} />

          <div className="detail-field full-width" style={{ borderTop: '1px solid var(--color-gray)', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <span className="detail-label">Leistungsempfänger</span>
          </div>
          <Field label="Name" value={invoice.empfaenger_name} />
          <Field label="Anschrift" value={invoice.empfaenger_anschrift} />

          <div className="detail-field full-width" style={{ borderTop: '1px solid var(--color-gray)', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <span className="detail-label">Beträge</span>
          </div>
          <Field label="Netto" value={formatCurrency(invoice.betrag_netto, invoice.waehrung)} isAmount />
          <Field label="MwSt" value={formatCurrency(invoice.betrag_mwst, invoice.waehrung)} />
          <Field label="Brutto" value={formatCurrency(invoice.betrag_brutto, invoice.waehrung)} isAmount />
          <Field label="Währung" value={invoice.waehrung} />

          <Field label="Beschreibung" value={invoice.beschreibung} fullWidth />
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
    'paid': 'paid',
    'bezahlt': 'paid',
    'pending': 'pending',
    'offen': 'pending',
    'overdue': 'overdue',
    'überfällig': 'overdue'
  }

  const className = statusMap[status.toLowerCase()] || 'pending'

  return (
    <span className={`status-badge ${className}`}>
      {status}
    </span>
  )
}

function formatDate(dateString) {
  if (!dateString) return null
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}

function formatCurrency(amount, currency = 'EUR') {
  if (amount == null) return null
  try {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency || 'EUR'
    }).format(amount)
  } catch {
    return `${amount} ${currency || 'EUR'}`
  }
}

export default DetailView
