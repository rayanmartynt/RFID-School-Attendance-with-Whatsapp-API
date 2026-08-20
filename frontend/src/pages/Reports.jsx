import { useState, useEffect } from 'react'
import { Calendar, Download, FileText } from 'lucide-react'
import api from '../services/api'
import { format } from 'date-fns'

const Reports = () => {
  const [reportType, setReportType] = useState('daily')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchReport = async () => {
    setLoading(true)
    try {
      let endpoint
      switch (reportType) {
        case 'daily':
          endpoint = `/reports/daily/${date}`
          break
        case 'weekly':
          const weekStart = format(new Date(date), 'yyyy-MM-dd')
          endpoint = `/reports/weekly/${weekStart}`
          break
        case 'monthly':
          const [year, month] = date.split('-')
          endpoint = `/reports/monthly/${year}/${month}`
          break
        default:
          endpoint = `/reports/daily/${date}`
      }

      const response = await api.get(endpoint)
      setReportData(response.data)
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [reportType, date])

  const handleExport = () => {
    if (!reportData) return
    
    const csvContent = convertToCSV(reportData)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportType}_report_${date}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const convertToCSV = (data) => {
    if (!data.studentAttendance) return ''
    
    const headers = ['Student ID', 'Name', 'Class', 'Arrival', 'Departure', 'Status', 'Late']
    const rows = data.studentAttendance.map(s => [
      s.student_id,
      `${s.first_name} ${s.last_name}`,
      `${s.grade} ${s.section}`,
      s.arrival_time || 'N/A',
      s.departure_time || 'N/A',
      s.status || 'N/A',
      s.is_late ? 'Yes' : 'No'
    ])
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Attendance Reports</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Generate and export attendance reports</p>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="input-field"
            >
              <option value="daily">Daily Report</option>
              <option value="weekly">Weekly Report</option>
              <option value="monthly">Monthly Report</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleExport}
              disabled={!reportData || loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download size={20} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {reportData.summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{reportData.summary.students.total}</p>
              </div>
              <div className="card">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Present</p>
                <p className="text-3xl font-bold text-success-600 dark:text-success-400">{reportData.summary.students.present}</p>
              </div>
              <div className="card">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Absent</p>
                <p className="text-3xl font-bold text-danger-600 dark:text-danger-400">{reportData.summary.students.absent}</p>
              </div>
              <div className="card">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Attendance Rate</p>
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{reportData.summary.students.attendanceRate}%</p>
              </div>
            </div>
          )}

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="text-primary-600 dark:text-primary-400" size={20} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Student Attendance Details</h3>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Arrival</th>
                    <th>Departure</th>
                    <th>Status</th>
                    <th>Late</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.studentAttendance && reportData.studentAttendance.length > 0 ? (
                    reportData.studentAttendance.map((record, index) => (
                      <tr key={index}>
                        <td className="font-medium text-gray-900 dark:text-gray-100">{record.student_id}</td>
                        <td className="text-gray-700 dark:text-gray-300">{record.first_name} {record.last_name}</td>
                        <td className="text-gray-700 dark:text-gray-300">{record.grade} {record.section}</td>
                        <td className="text-gray-700 dark:text-gray-300">{record.arrival_time || 'N/A'}</td>
                        <td className="text-gray-700 dark:text-gray-300">{record.departure_time || 'N/A'}</td>
                        <td className="text-gray-700 dark:text-gray-300">{record.status || 'N/A'}</td>
                        <td className="text-gray-700 dark:text-gray-300">{record.is_late ? 'Yes' : 'No'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="card text-center py-8 text-gray-500 dark:text-gray-400">
          No report data available
        </div>
      )}
    </div>
  )
}

export default Reports
