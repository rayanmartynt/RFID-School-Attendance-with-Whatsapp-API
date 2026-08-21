import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api from '../services/api'

const DeviceForm = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const isEdit = location.pathname.includes('/edit') && id

  const [formData, setFormData] = useState({
    device_id: '',
    device_name: '',
    location: '',
    device_type: 'ENTRANCE_READER',
    api_key: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const deviceId = parseInt(id)
    if (isEdit && deviceId && !isNaN(deviceId)) {
      fetchDevice()
    }
  }, [id])

  const fetchDevice = async () => {
    try {
      const deviceId = parseInt(id)
      if (!deviceId || isNaN(deviceId)) return
      const response = await api.get(`/devices/${deviceId}`)
      setFormData(response.data)
    } catch (error) {
      console.error('Error fetching device:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isEdit) {
        await api.put(`/devices/${id}`, formData)
      } else {
        await api.post('/devices', formData)
      }
      navigate('/devices')
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save device')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const generateApiKey = () => {
    const apiKey = `device_${Math.random().toString(36).substr(2, 16)}`
    setFormData({ ...formData, api_key: apiKey })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/devices')}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isEdit ? 'Edit Device' : 'Add New Device'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isEdit ? 'Update device information' : 'Register a new RFID reader device'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 text-danger-600 dark:text-danger-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Device ID *
              </label>
              <input
                type="text"
                name="device_id"
                value={formData.device_id}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., GATE-001"
                required
                disabled={isEdit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Device Name *
              </label>
              <input
                type="text"
                name="device_name"
                value={formData.device_name}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Main Entrance Reader"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Main Gate"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Device Type *
              </label>
              <select
                name="device_type"
                value={formData.device_type}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="ENTRANCE_READER">Entrance Reader</option>
                <option value="EXIT_READER">Exit Reader</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="api_key"
                  value={formData.api_key}
                  onChange={handleChange}
                  className="input-field flex-1"
                  placeholder="Device API key for authentication"
                  required
                />
                <button
                  type="button"
                  onClick={generateApiKey}
                  className="btn-secondary"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEdit ? 'Update Device' : 'Add Device'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/devices')}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DeviceForm
