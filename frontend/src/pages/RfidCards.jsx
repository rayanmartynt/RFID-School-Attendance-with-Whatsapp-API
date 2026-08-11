import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, Search, Edit, Power } from 'lucide-react'
import api from '../services/api'

const RfidCards = () => {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [personTypeFilter, setPersonTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchCards()
  }, [personTypeFilter, statusFilter])

  const fetchCards = async () => {
    try {
      const params = new URLSearchParams({
        personType: personTypeFilter,
        status: statusFilter
      })
      const response = await api.get(`/rfid?${params}`)
      setCards(response.data || [])
    } catch (error) {
      console.error('Error fetching RFID cards:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (uid, newStatus) => {
    try {
      await api.put(`/rfid/${uid}/status`, { status: newStatus })
      fetchCards()
    } catch (error) {
      console.error('Error updating card status:', error)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: 'badge-present',
      DISABLED: 'badge-absent',
      LOST: 'badge-absent',
      REPLACED: 'badge-departed'
    }
    return badges[status] || 'badge-pending'
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">RFID Cards</h1>
          <p className="text-gray-500">Manage RFID card registrations</p>
        </div>
        <Link to="/rfid-register" className="btn-primary flex items-center gap-2">
          <CreditCard size={20} />
          Register Card
        </Link>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={personTypeFilter}
            onChange={(e) => setPersonTypeFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Person Types</option>
            <option value="STUDENT">Student</option>
            <option value="STAFF">Staff</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
            <option value="LOST">Lost</option>
            <option value="REPLACED">Replaced</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>RFID UID</th>
                <th>Person Name</th>
                <th>Type</th>
                <th>ID Code</th>
                <th>Device</th>
                <th>Status</th>
                <th>Last Used</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cards.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    No RFID cards found
                  </td>
                </tr>
              ) : (
                cards.map((card) => (
                  <tr key={card.id}>
                    <td className="font-mono text-sm font-medium">{card.rfid_uid}</td>
                    <td>{card.person_name}</td>
                    <td>{card.person_type}</td>
                    <td>{card.person_id_code}</td>
                    <td>{card.device_id || 'N/A'}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(card.status)}`}>
                        {card.status}
                      </span>
                    </td>
                    <td>{card.last_used ? new Date(card.last_used).toLocaleString() : 'Never'}</td>
                    <td>
                      <select
                        value={card.status}
                        onChange={(e) => handleStatusChange(card.rfid_uid, e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="DISABLED">Disable</option>
                        <option value="LOST">Lost</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default RfidCards
