import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import api from '../services/api'

const Parents = () => {
  const [parents, setParents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchParents()
  }, [search])

  const fetchParents = async () => {
    try {
      const params = search ? `?search=${search}` : ''
      const response = await api.get(`/parents${params}`)
      setParents(response.data.parents || [])
    } catch (error) {
      console.error('Error fetching parents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this parent?')) return
    
    try {
      await api.delete(`/parents/${id}`)
      fetchParents()
    } catch (error) {
      console.error('Error deleting parent:', error)
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Parents/Guardians</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage parent and guardian records</p>
        </div>
        <Link to="/parents/new" className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Add Parent
        </Link>
      </div>

      <div className="card">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search parents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>WhatsApp</th>
                <th>Email</th>
                <th>Students</th>
                <th>Notifications</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {parents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No parents found
                  </td>
                </tr>
              ) : (
                parents.map((parent) => (
                  <tr key={parent.id}>
                    <td className="font-medium text-gray-900 dark:text-gray-100">
                      {parent.first_name} {parent.last_name}
                    </td>
                    <td className="text-gray-700 dark:text-gray-300">{parent.phone}</td>
                    <td className="text-gray-700 dark:text-gray-300">{parent.whatsapp_number}</td>
                    <td className="text-gray-700 dark:text-gray-300">{parent.email}</td>
                    <td className="text-gray-700 dark:text-gray-300">{parent.student_count || 0}</td>
                    <td>
                      <span className={`badge ${parent.notifications_enabled ? 'badge-present' : 'badge-absent'}`}>
                        {parent.notifications_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/parents/${parent.id}/edit`}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(parent.id)}
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

export default Parents
