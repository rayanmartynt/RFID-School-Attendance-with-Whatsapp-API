import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2 } from 'lucide-react'
import api from '../services/api'

const Classes = () => {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes')
      setClasses(response.data || [])
    } catch (error) {
      console.error('Error fetching classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this class?')) return
    
    try {
      await api.delete(`/classes/${id}`)
      fetchClasses()
    } catch (error) {
      console.error('Error deleting class:', error)
    }
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Classes</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage class information</p>
        </div>
        <Link to="/classes/new" className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Add Class
        </Link>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Section</th>
                <th>Academic Year</th>
                <th>Capacity</th>
                <th>Students</th>
                <th>Attendance Rate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No classes found
                  </td>
                </tr>
              ) : (
                classes.map((cls) => (
                  <tr key={cls.id}>
                    <td className="font-medium text-gray-900 dark:text-gray-100">{cls.grade}</td>
                    <td className="text-gray-700 dark:text-gray-300">{cls.section}</td>
                    <td className="text-gray-700 dark:text-gray-300">{cls.academic_year}</td>
                    <td className="text-gray-700 dark:text-gray-300">{cls.capacity}</td>
                    <td className="text-gray-700 dark:text-gray-300">{cls.student_count || 0}</td>
                    <td>
                      <span className="font-medium text-primary-600 dark:text-primary-400">
                        {cls.student_count > 0 && cls.capacity > 0
                          ? ((cls.student_count / cls.capacity) * 100).toFixed(1)
                          : '0'}%
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/classes/${cls.id}/edit`}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(cls.id)}
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

export default Classes
