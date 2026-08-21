import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Upload, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import api from '../services/api'
import { toast } from 'react-toastify'

const Staff = () => {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchStaff()
  }, [search, departmentFilter, statusFilter])

  const fetchStaff = async () => {
    try {
      const params = new URLSearchParams({
        search,
        department: departmentFilter,
        status: statusFilter
      })
      const response = await api.get(`/staff?${params}`)
      setStaff(response.data.staff || [])
    } catch (error) {
      console.error('Error fetching staff:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return
    
    try {
      await api.delete(`/staff/${id}`)
      fetchStaff()
    } catch (error) {
      console.error('Error deleting staff:', error)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: 'badge-present',
      INACTIVE: 'badge-absent',
      RESIGNED: 'badge-departed',
      TERMINATED: 'badge-absent'
    }
    return badges[status] || 'badge-pending'
  }

  const handleExport = async () => {
    try {
      const response = await api.get('/excel/export/staff', {
        responseType: 'blob',
        params: { department: departmentFilter, status: statusFilter }
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'staff_export.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error exporting staff:', error)
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

        const response = await api.post('/excel/import/staff', { data: jsonData })

        if (response.data.success) {
          toast.success(`Imported ${response.data.imported} staff members successfully`)
          if (response.data.errors && response.data.errors.length > 0) {
            console.warn('Import errors:', response.data.errors)
          }
          fetchStaff()
        }
      } catch (error) {
        console.error('Error importing staff:', error)
        toast.error('Failed to import staff')
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Staff</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage staff records</p>
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
          <Link to="/staff/new" className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            Add Staff
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Departments</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Administration">Administration</option>
            <option value="Security">Security</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="RESIGNED">Resigned</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Name</th>
                <th>Position</th>
                <th>Department</th>
                <th>Phone</th>
                <th>RFID UID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No staff found
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id}>
                    <td className="font-medium text-gray-900 dark:text-gray-100">{member.staff_id}</td>
                    <td className="text-gray-700 dark:text-gray-300">
                      {member.first_name} {member.last_name}
                    </td>
                    <td className="text-gray-700 dark:text-gray-300">{member.position}</td>
                    <td className="text-gray-700 dark:text-gray-300">{member.department}</td>
                    <td className="text-gray-700 dark:text-gray-300">{member.phone_number}</td>
                    <td className="font-mono text-sm text-gray-600 dark:text-gray-400">{member.rfid_uid || 'N/A'}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/staff/${member.id}/edit`}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(member.id)}
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

export default Staff
