import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter, Edit, Trash2, Upload, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import api from '../services/api'
import { toast } from 'react-toastify'

const Students = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchStudents()
  }, [page, search, classFilter, statusFilter])

  const fetchStudents = async () => {
    try {
      const params = new URLSearchParams({
        page,
        search,
        classId: classFilter,
        status: statusFilter
      })
      const response = await api.get(`/students?${params}`)
      setStudents(response.data.students || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this student?')) return
    
    try {
      await api.delete(`/students/${id}`)
      fetchStudents()
    } catch (error) {
      console.error('Error deleting student:', error)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: 'badge-present',
      INACTIVE: 'badge-absent',
      GRADUATED: 'badge-departed',
      TRANSFERRED: 'badge-pending'
    }
    return badges[status] || 'badge-pending'
  }

  const handleExport = async () => {
    try {
      const response = await api.get('/excel/export/students', {
        responseType: 'blob',
        params: { classId: classFilter, status: statusFilter }
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'students_export.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error exporting students:', error)
    }
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        const response = await api.post('/excel/import/students', { data: jsonData })

        if (response.data.success) {
          toast.success(`Imported ${response.data.imported} students successfully`)
          if (response.data.errors && response.data.errors.length > 0) {
            console.warn('Import errors:', response.data.errors)
          }
          fetchStudents()
        }
      } catch (error) {
        console.error('Error importing students:', error)
        toast.error('Failed to import students')
      }
    }
    reader.readAsArrayBuffer(file)
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Students</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage student records</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            id="import-excel"
            accept=".xlsx,.xls"
            onChange={handleImport}
            className="hidden"
          />
          <label
            htmlFor="import-excel"
            className="btn-secondary flex items-center gap-2 cursor-pointer"
          >
            <Upload size={20} />
            Import Excel
          </label>
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={20} />
            Export Excel
          </button>
          <Link to="/students/new" className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            Add Student
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Classes</option>
            <option value="1">Grade 10A</option>
            <option value="2">Grade 10B</option>
            <option value="3">Grade 11A</option>
            <option value="4">Grade 11B</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="GRADUATED">Graduated</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Class</th>
                <th>Parent</th>
                <th>Parent Phone</th>
                <th>RFID UID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No students found
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id}>
                    <td className="font-medium text-gray-900 dark:text-gray-100">{student.student_id}</td>
                    <td className="text-gray-700 dark:text-gray-300">
                      {student.first_name} {student.last_name}
                    </td>
                    <td className="text-gray-700 dark:text-gray-300">{student.grade} {student.section}</td>
                    <td className="text-gray-700 dark:text-gray-300">
                      {student.parent_first_name} {student.parent_last_name}
                    </td>
                    <td className="text-gray-700 dark:text-gray-300">{student.parent_phone}</td>
                    <td className="font-mono text-sm text-gray-600 dark:text-gray-400">{student.rfid_uid || 'N/A'}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(student.status)}`}>
                        {student.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/students/${student.id}/edit`}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(student.id)}
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

export default Students
