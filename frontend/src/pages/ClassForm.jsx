import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api from '../services/api'

const ClassForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    grade: '',
    section: '',
    academic_year_id: '',
    capacity: 40
  })

  const [academicYears, setAcademicYears] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAcademicYears()
    if (isEdit) {
      fetchClass()
    }
  }, [id])

  const fetchAcademicYears = async () => {
    try {
      const response = await api.get('/academic-years')
      setAcademicYears(response.data || [])
    } catch (error) {
      console.error('Error fetching academic years:', error)
    }
  }

  const fetchClass = async () => {
    try {
      const response = await api.get(`/classes/${id}`)
      setFormData({
        grade: response.data.class.grade,
        section: response.data.class.section,
        academic_year_id: response.data.class.academic_year_id,
        capacity: response.data.class.capacity
      })
    } catch (error) {
      console.error('Error fetching class:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isEdit) {
        await api.put(`/classes/${id}`, formData)
      } else {
        await api.post('/classes', formData)
      }
      navigate('/classes')
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save class')
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
          onClick={() => navigate('/classes')}
          className="text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? 'Edit Class' : 'Add New Class'}
          </h1>
          <p className="text-gray-500">
            {isEdit ? 'Update class information' : 'Create a new class'}
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
                Grade *
              </label>
              <input
                type="text"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Grade 10"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section *
              </label>
              <input
                type="text"
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., A"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year *
              </label>
              <select
                name="academic_year_id"
                value={formData.academic_year_id}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Select Academic Year</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name} ({year.start_date} - {year.end_date})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacity *
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                className="input-field"
                min="1"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEdit ? 'Update Class' : 'Add Class'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/classes')}
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

export default ClassForm
