import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CreditCard } from 'lucide-react'
import api from '../services/api'

const RfidRegister = () => {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    personType: 'STUDENT',
    personId: '',
    rfidUid: '',
    deviceId: ''
  })

  const [students, setStudents] = useState([])
  const [staff, setStaff] = useState([])
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    fetchStudents()
    fetchStaff()
    fetchDevices()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students')
      setStudents(response.data.students || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const fetchStaff = async () => {
    try {
      const response = await api.get('/staff')
      setStaff(response.data.staff || [])
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

  const fetchDevices = async () => {
    try {
      const response = await api.get('/devices')
      setDevices(response.data || [])
    } catch (error) {
      console.error('Error fetching devices:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/rfid/register', formData)
      navigate('/rfid-cards')
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to register RFID card')
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

  const simulateScan = () => {
    setScanning(true)
    setTimeout(() => {
      const randomUid = Math.random().toString(16).substr(2, 8).toUpperCase()
      const formattedUid = randomUid.match(/.{1,2}/g).join(' ')
      setFormData({ ...formData, rfid_uid: formattedUid })
      setScanning(false)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/rfid-cards')}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Register RFID Card</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Assign an RFID card to a person</p>
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
                Person Type *
              </label>
              <select
                name="personType"
                value={formData.personType}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="STUDENT">Student</option>
                <option value="STAFF">Staff</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {formData.personType === 'STUDENT' ? 'Student' : 'Staff'} *
              </label>
              <select
                name="personId"
                value={formData.personId}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Select {formData.personType === 'STUDENT' ? 'Student' : 'Staff'}</option>
                {formData.personType === 'STUDENT' 
                  ? students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.student_id} - {s.first_name} {s.last_name}
                      </option>
                    ))
                  : staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.staff_id} - {s.first_name} {s.last_name}
                      </option>
                    ))
                }
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                RFID UID *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="rfidUid"
                  value={formData.rfidUid}
                  onChange={handleChange}
                  className="input-field flex-1"
                  placeholder="e.g., A3 7B 91 22"
                  required
                />
                <button
                  type="button"
                  onClick={simulateScan}
                  disabled={scanning}
                  className="btn-secondary flex items-center gap-2"
                >
                  <CreditCard size={18} />
                  {scanning ? 'Scanning...' : 'Scan'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Device *
              </label>
              <select
                name="deviceId"
                value={formData.deviceId}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Select Device</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.device_id}>
                    {device.device_id} - {device.device_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Card'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/rfid-cards')}
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

export default RfidRegister
