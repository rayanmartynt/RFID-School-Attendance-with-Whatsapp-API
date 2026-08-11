import { useState, useEffect } from 'react'
import { connectSocket } from '../services/api'
import { 
  Users, UserCheck, Clock, AlertCircle, 
  TrendingUp, Activity 
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = {
  present: '#16A34A',
  absent: '#DC2626',
  late: '#F59E0B'
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
        fetch('/api/v1/dashboard/statistics'),
        fetch('/api/v1/dashboard/recent-activity'),
        fetch('/api/v1/dashboard/class-attendance')
      ])

      const stats = await statsRes.json()
      const activity = await activityRes.json()
      const classes = await classRes.json()

      setStatistics(stats)
      setRecentActivity(activity.activity || [])
      setClassAttendance(classes.classes || [])
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
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">Overview of today's attendance</p>
      </div>

      {/* Student Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Students</p>
              <p className="text-3xl font-bold text-gray-800">
                {statistics?.students?.total || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="text-primary" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Present Today</p>
              <p className="text-3xl font-bold text-success">
                {statistics?.students?.present || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <UserCheck className="text-success" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Absent Today</p>
              <p className="text-3xl font-bold text-danger">
                {statistics?.students?.absent || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="text-danger" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Late Today</p>
              <p className="text-3xl font-bold text-warning">
                {statistics?.students?.late || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="text-warning" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Staff Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Staff</p>
              <p className="text-3xl font-bold text-gray-800">
                {statistics?.staff?.total || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Staff Present</p>
              <p className="text-3xl font-bold text-success">
                {statistics?.staff?.present || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <UserCheck className="text-success" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Staff Absent</p>
              <p className="text-3xl font-bold text-danger">
                {statistics?.staff?.absent || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="text-danger" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Rate and Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Student Attendance Rate</h3>
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
                <span className="text-2xl font-bold">
                  {statistics?.attendanceRate?.students || 0}%
                </span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success"></div>
                  <span className="text-sm">Present</span>
                </div>
                <span className="font-semibold">{statistics?.students?.present || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-danger"></div>
                  <span className="text-sm">Absent</span>
                </div>
                <span className="font-semibold">{statistics?.students?.absent || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning"></div>
                  <span className="text-sm">Late</span>
                </div>
                <span className="font-semibold">{statistics?.students?.late || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Staff Attendance Rate</h3>
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <p className="text-5xl font-bold text-primary mb-2">
                {statistics?.attendanceRate?.staff || 0}%
              </p>
              <p className="text-gray-500">Staff Attendance Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="text-primary" size={20} />
          <h3 className="text-lg font-semibold">Live Attendance Activity</h3>
        </div>
        <div className="space-y-3">
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          ) : (
            recentActivity.map((activity, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.personType === 'STUDENT' ? 'bg-green-500' : 'bg-blue-500'
                  }`}></div>
                  <div>
                    <p className="font-medium">{activity.name}</p>
                    <p className="text-sm text-gray-500">
                      {activity.personType} • {activity.class || activity.department || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{activity.event}</p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Class Attendance Overview */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Class Attendance Overview</h3>
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
                  <td className="font-medium">{classData.grade} {classData.section}</td>
                  <td>{classData.total_students}</td>
                  <td className="text-success">{classData.present}</td>
                  <td className="text-danger">{classData.absent}</td>
                  <td className="text-warning">{classData.late}</td>
                  <td>
                    <span className={`font-medium ${
                      parseFloat(classData.attendance_rate) >= 80 ? 'text-success' : 
                      parseFloat(classData.attendance_rate) >= 60 ? 'text-warning' : 'text-danger'
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
