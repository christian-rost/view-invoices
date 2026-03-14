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
              <div className="tree-item-top-row">
                <div className="tree-item-nummer">
                  {invoice.nummer || `#${invoice.id}`}
                </div>
                <WorkflowBadge status={invoice.workflow_status || 'offen'} small />
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

export function WorkflowBadge({ status, small = false }) {
  const labels = {
    offen: 'Offen',
    in_pruefung: 'In Prüfung',
    freigegeben: 'Freigegeben',
    archiviert: 'Archiviert',
    abgelehnt: 'Abgelehnt',
    zurueckgestellt: 'Zurückgestellt',
  }
  const s = status || 'offen'
  return (
    <span className={`workflow-badge workflow-badge-${s}${small ? ' workflow-badge-small' : ''}`}>
      {labels[s] || s}
    </span>
  )
}

function formatDate(dateString) {
  return dateString || 'Kein Datum'
}

export default TreeView
