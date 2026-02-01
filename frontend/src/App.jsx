import { useState, useEffect } from 'react'
import { useAuth } from './auth.jsx'
import Login from './components/Login.jsx'
import TreeView from './components/TreeView.jsx'
import DetailView from './components/DetailView.jsx'

function App() {
  const { user, loading, logout, fetchWithAuth, isAuthenticated } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [invoiceDetail, setInvoiceDetail] = useState(null)
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isAuthenticated) {
      loadInvoices()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (selectedInvoice) {
      loadInvoiceDetail(selectedInvoice.id)
    } else {
      setInvoiceDetail(null)
    }
  }, [selectedInvoice])

  async function loadInvoices() {
    setLoadingInvoices(true)
    setError(null)

    try {
      const response = await fetchWithAuth('/api/invoices')
      if (response.ok) {
        const data = await response.json()
        setInvoices(data)
      } else {
        const err = await response.json()
        setError(err.detail || 'Failed to load invoices')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setLoadingInvoices(false)
    }
  }

  async function loadInvoiceDetail(id) {
    setLoadingDetail(true)

    try {
      const response = await fetchWithAuth(`/api/invoices/${id}`)
      if (response.ok) {
        const data = await response.json()
        setInvoiceDetail(data)
      } else {
        setInvoiceDetail(null)
      }
    } catch (err) {
      setInvoiceDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }

  if (loading) {
    return (
      <div className="loading" style={{ minHeight: '100vh' }}>
        <div className="loading-spinner"></div>
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <div className="app">
      <header className="header">
        <h1>View Invoices</h1>
        <div className="header-user">
          <span>{user?.username}</span>
          <button className="btn btn-outline" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <main className="main-content">
        <TreeView
          invoices={invoices}
          selectedInvoice={selectedInvoice}
          onSelect={setSelectedInvoice}
          loading={loadingInvoices}
          error={error}
        />

        <DetailView
          invoice={invoiceDetail}
          loading={loadingDetail}
        />
      </main>
    </div>
  )
}

export default App
