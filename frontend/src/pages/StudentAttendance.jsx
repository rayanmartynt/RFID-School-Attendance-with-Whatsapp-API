import { useState, useEffect } from 'react'
import { Search, Calendar, Filter } from 'lucide-react'
import api from '../services/api'
import { format } from 'date-fns'

const StudentAttendance = () => {
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [classFilter, setClassFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchAttendance()
  }, [date, classFilter, statusFilter])

  const fetchAttendance = async () => {
    try {
      const params = new URLSearchParams({
        date,
        classId: classFilter,
        status: statusFilter
      })
      const response = await api.get(`/attendance?${params}`)
      setAttendance(response.data.attendance || [])
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      PRESENT: 'badge-present',
      ABSENT: 'badge-absent',
      LATE: 'badge-late',
      DEPARTED: 'badge-departed',
      NOT_YET_ARRIVED: 'badge-pending'
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Student Attendance</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">View and manage student attendance records</p>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="LATE">Late</option>
            <option value="DEPARTED">Departed</option>
          </select>
        </div>
      </div>

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
                <th>Arrival</th>
                <th>Departure</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr key={record.id}>
                    <td className="font-medium text-gray-900 dark:text-gray-100">{record.student_id}</td>
                    <td className="text-gray-700 dark:text-gray-300">
                      {record.first_name} {record.last_name}
                    </td>
                    <td className="text-gray-700 dark:text-gray-300">{record.grade} {record.section}</td>
                    <td className="text-gray-700 dark:text-gray-300">
                      {record.parent_first_name} {record.parent_last_name}
                    </td>
                    <td className="text-gray-700 dark:text-gray-300">{record.parent_phone}</td>
                    <td className="text-gray-700 dark:text-gray-300">{record.arrival_time || 'N/A'}</td>
                    <td className="text-gray-700 dark:text-gray-300">{record.departure_time || 'N/A'}</td>
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

export default StudentAttendance
