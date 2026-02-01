function TreeView({ invoices, selectedInvoice, onSelect, loading, error }) {
  if (loading) {
    return (
      <div className="tree-view">
        <div className="tree-view-header">Rechnungen</div>
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="tree-view">
        <div className="tree-view-header">Rechnungen</div>
        <div className="loading" style={{ color: 'var(--color-error)' }}>
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="tree-view">
      <div className="tree-view-header">
        Rechnungen ({invoices.length})
      </div>
      <div className="tree-view-list">
        {invoices.length === 0 ? (
          <div className="loading">Keine Rechnungen vorhanden</div>
        ) : (
          invoices.map((invoice) => (
            <div
              key={invoice.id}
              className={`tree-item ${selectedInvoice?.id === invoice.id ? 'selected' : ''}`}
              onClick={() => onSelect(invoice)}
            >
              <div className="tree-item-nummer">
                {invoice.nummer || `#${invoice.id}`}
              </div>
              <div className="tree-item-datum">
                {invoice.datum ? formatDate(invoice.datum) : 'Kein Datum'}
              </div>
              <div className="tree-item-erbringer">
                {invoice.erbringer_name || 'Unbekannt'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function formatDate(dateString) {
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

export default TreeView
