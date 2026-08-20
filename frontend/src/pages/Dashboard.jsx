import { useState, useEffect } from 'react'
import api from '../services/api'
import { connectSocket } from '../services/api'
import { 
  Users, UserCheck, Clock, AlertCircle, 
  TrendingUp, Activity 
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = {
  present: '#22c55e',
  absent: '#ef4444',
  late: '#f59e0b'
}

const Dashboard = () => {
  const [statistics, setStatistics] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [classAttendance, setClassAttendance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    setupSocketConnection()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes, classRes] = await Promise.all([
        api.get('/dashboard/statistics'),
        api.get('/dashboard/recent-activity'),
        api.get('/dashboard/class-attendance')
      ])

      setStatistics(statsRes.data)
      setRecentActivity(activityRes.data.activity || [])
      setClassAttendance(classRes.data.classes || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupSocketConnection = () => {
    const socket = connectSocket()
    socket.emit('join-dashboard')
    
    socket.on('attendance-update', (data) => {
      setRecentActivity(prev => [data, ...prev].slice(0, 10))
      fetchDashboardData()
    })

    return () => {
      socket.off('attendance-update')
    }
  }

  const studentChartData = statistics ? [
    { name: 'Present', value: statistics.students.present, color: COLORS.present },
    { name: 'Absent', value: statistics.students.absent, color: COLORS.absent },
    { name: 'Late', value: statistics.students.late, color: COLORS.late }
  ] : []

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of today's attendance</p>
      </div>

      {/* Student Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Students</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {statistics?.students?.total || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
              <Users className="text-primary-600 dark:text-primary-400" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Present Today</p>
              <p className="text-3xl font-bold text-success-600 dark:text-success-400">
                {statistics?.students?.present || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-xl flex items-center justify-center">
              <UserCheck className="text-success-600 dark:text-success-400" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Absent Today</p>
              <p className="text-3xl font-bold text-danger-600 dark:text-danger-400">
                {statistics?.students?.absent || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-xl flex items-center justify-center">
              <AlertCircle className="text-danger-600 dark:text-danger-400" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Late Today</p>
              <p className="text-3xl font-bold text-warning-600 dark:text-warning-400">
                {statistics?.students?.late || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-xl flex items-center justify-center">
              <Clock className="text-warning-600 dark:text-warning-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Staff Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Staff</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {statistics?.staff?.total || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <Users className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Staff Present</p>
              <p className="text-3xl font-bold text-success-600 dark:text-success-400">
                {statistics?.staff?.present || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-xl flex items-center justify-center">
              <UserCheck className="text-success-600 dark:text-success-400" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Staff Absent</p>
              <p className="text-3xl font-bold text-danger-600 dark:text-danger-400">
                {statistics?.staff?.absent || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-xl flex items-center justify-center">
              <AlertCircle className="text-danger-600 dark:text-danger-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Rate and Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Student Attendance Rate</h3>
          <div className="flex items-center gap-8">
            <div className="relative w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={studentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {studentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {statistics?.attendanceRate?.students || 0}%
                </span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success-500"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Present</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{statistics?.students?.present || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-danger-500"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Absent</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{statistics?.students?.absent || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning-500"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Late</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{statistics?.students?.late || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Staff Attendance Rate</h3>
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <p className="text-5xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                {statistics?.attendanceRate?.staff || 0}%
              </p>
              <p className="text-gray-500 dark:text-gray-400">Staff Attendance Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="text-primary-600 dark:text-primary-400" size={20} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Live Attendance Activity</h3>
        </div>
        <div className="space-y-3">
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent activity</p>
          ) : (
            recentActivity.map((activity, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.personType === 'STUDENT' ? 'bg-success-500' : 'bg-primary-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{activity.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activity.personType} • {activity.class || activity.department || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{activity.event}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Class Attendance Overview */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Class Attendance Overview</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Total Students</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Late</th>
                <th>Attendance Rate</th>
              </tr>
            </thead>
            <tbody>
              {classAttendance.map((classData) => (
                <tr key={classData.id}>
                  <td className="font-medium text-gray-900 dark:text-gray-100">{classData.grade} {classData.section}</td>
                  <td>{classData.total_students}</td>
                  <td className="text-success-600 dark:text-success-400">{classData.present}</td>
                  <td className="text-danger-600 dark:text-danger-400">{classData.absent}</td>
                  <td className="text-warning-600 dark:text-warning-400">{classData.late}</td>
                  <td>
                    <span className={`font-medium ${
                      parseFloat(classData.attendance_rate) >= 80 ? 'text-success-600 dark:text-success-400' : 
                      parseFloat(classData.attendance_rate) >= 60 ? 'text-warning-600 dark:text-warning-400' : 'text-danger-600 dark:text-danger-400'
                    }`}>
                      {classData.attendance_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
