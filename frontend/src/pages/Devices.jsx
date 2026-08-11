import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Wifi, WifiOff } from 'lucide-react'
import api from '../services/api'

const Devices = () => {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    try {
      const response = await api.get('/devices')
      setDevices(response.data || [])
    } catch (error) {
      console.error('Error fetching devices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async (deviceId, currentStatus) => {
    const newStatus = currentStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE'
    try {
      await api.put(`/devices/${deviceId}/status`, { status: newStatus })
      fetchDevices()
    } catch (error) {
      console.error('Error updating device status:', error)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      ONLINE: 'badge-present',
      OFFLINE: 'badge-absent',
      MAINTENANCE: 'badge-late',
      DISABLED: 'badge-pending'
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
          <h1 className="text-2xl font-bold text-gray-800">Devices</h1>
          <p className="text-gray-500">Manage RFID reader devices</p>
        </div>
        <Link to="/devices/new" className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Add Device
        </Link>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Device ID</th>
                <th>Device Name</th>
                <th>Location</th>
                <th>Type</th>
                <th>Status</th>
                <th>Last Seen</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    No devices found
                  </td>
                </tr>
              ) : (
                devices.map((device) => (
                  <tr key={device.id}>
                    <td className="font-medium">{device.device_id}</td>
                    <td>{device.device_name}</td>
                    <td>{device.location}</td>
                    <td>{device.device_type.replace('_', ' ')}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(device.status)}`}>
                        {device.status}
                      </span>
                    </td>
                    <td>
                      {device.last_seen 
                        ? new Date(device.last_seen).toLocaleString()
                        : 'Never'
                      }
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/devices/${device.device_id}/edit`}
                          className="text-primary hover:text-primary-dark"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleStatusToggle(device.device_id, device.status)}
                          className={device.status === 'ONLINE' ? 'text-danger' : 'text-success'}
                        >
                          {device.status === 'ONLINE' ? <WifiOff size={18} /> : <Wifi size={18} />}
                        </button>
                      </div>
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

export default Devices
