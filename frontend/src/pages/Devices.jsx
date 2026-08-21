import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Wifi, WifiOff, Trash2 } from 'lucide-react'
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

  const handleStatusToggle = async (device, currentStatus) => {
    const deviceId = device.device_id || device.deviceId || device.id
    if (!deviceId) {
      console.error('Device ID is undefined:', device)
      return
    }
    const newStatus = currentStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE'
    try {
      await api.put(`/devices/${deviceId}/status`, { status: newStatus })
      fetchDevices()
    } catch (error) {
      console.error('Error updating device status:', error)
    }
  }

  const handleDelete = async (device) => {
    const deviceId = device.device_id || device.deviceId || device.id
    if (!deviceId) {
      console.error('Device ID is undefined:', device)
      return
    }
    if (!window.confirm('Are you sure you want to delete this device?')) {
      return
    }
    try {
      await api.delete(`/devices/${deviceId}`)
      fetchDevices()
    } catch (error) {
      console.error('Error deleting device:', error)
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Devices</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage RFID reader devices</p>
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
                  <td colSpan="7" className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No devices found
                  </td>
                </tr>
              ) : (
                devices.map((device) => (
                  <tr key={device.id}>
                    <td className="font-medium text-gray-900 dark:text-gray-100">{device.device_id}</td>
                    <td className="text-gray-700 dark:text-gray-300">{device.device_name}</td>
                    <td className="text-gray-700 dark:text-gray-300">{device.location}</td>
                    <td className="text-gray-700 dark:text-gray-300">{device.device_type ? device.device_type.replace('_', ' ') : 'N/A'}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(device.status)}`}>
                        {device.status}
                      </span>
                    </td>
                    <td className="text-gray-700 dark:text-gray-300">
                      {device.last_seen 
                        ? new Date(device.last_seen).toLocaleString()
                        : 'Never'
                      }
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/devices/${device.device_id}/edit`}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleStatusToggle(device, device.status)}
                          className={device.status === 'ONLINE' ? 'text-danger-600 dark:text-danger-400 hover:text-danger-700 dark:hover:text-danger-300 transition-colors' : 'text-success-600 dark:text-success-400 hover:text-success-700 dark:hover:text-success-300 transition-colors'}
                        >
                          {device.status === 'ONLINE' ? <WifiOff size={18} /> : <Wifi size={18} />}
                        </button>
                        <button
                          onClick={() => handleDelete(device)}
                          className="text-danger-600 dark:text-danger-400 hover:text-danger-700 dark:hover:text-danger-300 transition-colors"
                        >
                          <Trash2 size={18} />
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
