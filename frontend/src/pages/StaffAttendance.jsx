import { useState, useEffect } from 'react'
import { Calendar, Filter } from 'lucide-react'
import api from '../services/api'
import { format } from 'date-fns'

const StaffAttendance = () => {
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchAttendance()
  }, [date, departmentFilter, statusFilter])

  const fetchAttendance = async () => {
    try {
      const params = new URLSearchParams({
        date,
        department: departmentFilter,
        status: statusFilter
      })
      const response = await api.get(`/staff-attendance?${params}`)
      setAttendance(response.data.attendance || [])
    } catch (error) {
      console.error('Error fetching staff attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      PRESENT: 'badge-present',
      ABSENT: 'badge-absent',
      DEPARTED: 'badge-departed'
    }
    return badges[status] || 'badge-pending'
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Staff Attendance</h1>
        <p className="text-gray-500">View and manage staff attendance records</p>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="DEPARTED">Departed</option>
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
                <th>Department</th>
                <th>Position</th>
                <th>Arrival</th>
                <th>Departure</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr key={record.id}>
                    <td className="font-medium">{record.staff_id}</td>
                    <td>
                      {record.first_name} {record.last_name}
                    </td>
                    <td>{record.department}</td>
                    <td>{record.position}</td>
                    <td>{record.arrival_time || 'N/A'}</td>
                    <td>{record.departure_time || 'N/A'}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(record.status)}`}>
                        {record.status}
                      </span>
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

export default StaffAttendance
