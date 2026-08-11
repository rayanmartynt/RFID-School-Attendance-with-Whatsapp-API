import { useState, useEffect } from 'react'
import { Bell, CheckCircle, XCircle, Clock } from 'lucide-react'
import api from '../services/api'

const Notifications = () => {
  const [logs, setLogs] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchLogs()
    fetchStatistics()
  }, [statusFilter])

  const fetchLogs = async () => {
    try {
      const params = statusFilter ? `?status=${statusFilter}` : ''
      const response = await api.get(`/notifications/logs${params}`)
      setLogs(response.data.logs || [])
    } catch (error) {
      console.error('Error fetching notification logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/notifications/statistics')
      setStatistics(response.data)
    } catch (error) {
      console.error('Error fetching statistics:', error)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SENT':
        return <CheckCircle className="text-success" size={20} />
      case 'FAILED':
        return <XCircle className="text-danger" size={20} />
      case 'PENDING':
        return <Clock className="text-warning" size={20} />
      default:
        return null
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">WhatsApp Notifications</h1>
        <p className="text-gray-500">View notification history and statistics</p>
      </div>

      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-success" size={24} />
              <div>
                <p className="text-sm text-gray-500">Sent Today</p>
                <p className="text-2xl font-bold">{statistics.totalSent}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <XCircle className="text-danger" size={24} />
              <div>
                <p className="text-sm text-gray-500">Failed Today</p>
                <p className="text-2xl font-bold">{statistics.totalFailed}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <Bell className="text-primary" size={24} />
              <div>
                <p className="text-sm text-gray-500">Total Today</p>
                <p className="text-2xl font-bold">{statistics.totalSent + statistics.totalFailed}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Notification Logs</h3>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-48"
          >
            <option value="">All Status</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Student</th>
                <th>Parent</th>
                <th>Type</th>
                <th>Phone</th>
                <th>Sent At</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    No notification logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span className="font-medium">{log.status}</span>
                      </div>
                    </td>
                    <td>
                      {log.student_first_name} {log.student_last_name}
                    </td>
                    <td>
                      {log.parent_first_name} {log.parent_last_name}
                    </td>
                    <td>{log.notification_type}</td>
                    <td className="font-mono text-sm">{log.phone_number}</td>
                    <td>
                      {new Date(log.sent_at).toLocaleString()}
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

export default Notifications
