import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api from '../services/api'

const StudentForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    gender: 'Male',
    date_of_birth: '',
    class_id: '',
    parent_id: '',
    rfid_uid: '',
    address: '',
    status: 'ACTIVE'
  })

  const [classes, setClasses] = useState([])
  const [parents, setParents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchClasses()
    fetchParents()
    if (isEdit) {
      fetchStudent()
    }
  }, [id])

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes')
      setClasses(response.data || [])
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  const fetchParents = async () => {
    try {
      const response = await api.get('/parents')
      setParents(response.data.parents || [])
    } catch (error) {
      console.error('Error fetching parents:', error)
    }
  }

  const fetchStudent = async () => {
    try {
      const response = await api.get(`/students/${id}`)
      setFormData(response.data)
    } catch (error) {
      console.error('Error fetching student:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isEdit) {
        await api.put(`/students/${id}`, formData)
      } else {
        await api.post('/students', formData)
      }
      navigate('/students')
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save student')
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/students')}
          className="text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? 'Edit Student' : 'Add New Student'}
          </h1>
          <p className="text-gray-500">
            {isEdit ? 'Update student information' : 'Register a new student'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student ID *
              </label>
              <input
                type="text"
                name="student_id"
                value={formData.student_id}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth *
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class *
              </label>
              <select
                name="class_id"
                value={formData.class_id}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.grade} {cls.section}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent/Guardian *
              </label>
              <select
                name="parent_id"
                value={formData.parent_id}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Select Parent</option>
                {parents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.first_name} {parent.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RFID UID
              </label>
              <input
                type="text"
                name="rfid_uid"
                value={formData.rfid_uid}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., A3 7B 91 22"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="GRADUATED">Graduated</option>
                <option value="TRANSFERRED">Transferred</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="input-field"
              rows="3"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEdit ? 'Update Student' : 'Add Student'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/students')}
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

export default StudentForm
