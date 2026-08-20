import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import StudentForm from './pages/StudentForm'
import Parents from './pages/Parents'
import ParentForm from './pages/ParentForm'
import Staff from './pages/Staff'
import StaffForm from './pages/StaffForm'
import StudentAttendance from './pages/StudentAttendance'
import StaffAttendance from './pages/StaffAttendance'
import RfidCards from './pages/RfidCards'
import RfidRegister from './pages/RfidRegister'
import Classes from './pages/Classes'
import ClassForm from './pages/ClassForm'
import Reports from './pages/Reports'
import Devices from './pages/Devices'
import DeviceForm from './pages/DeviceForm'
import Notifications from './pages/Notifications'

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="students/new" element={<StudentForm />} />
              <Route path="students/:id/edit" element={<StudentForm />} />
              <Route path="parents" element={<Parents />} />
              <Route path="parents/new" element={<ParentForm />} />
              <Route path="parents/:id/edit" element={<ParentForm />} />
              <Route path="staff" element={<Staff />} />
              <Route path="staff/new" element={<StaffForm />} />
              <Route path="staff/:id/edit" element={<StaffForm />} />
              <Route path="student-attendance" element={<StudentAttendance />} />
              <Route path="staff-attendance" element={<StaffAttendance />} />
              <Route path="rfid-cards" element={<RfidCards />} />
              <Route path="rfid-register" element={<RfidRegister />} />
              <Route path="classes" element={<Classes />} />
              <Route path="classes/new" element={<ClassForm />} />
              <Route path="classes/:id/edit" element={<ClassForm />} />
              <Route path="reports" element={<Reports />} />
              <Route path="devices" element={<Devices />} />
              <Route path="devices/new" element={<DeviceForm />} />
              <Route path="devices/:id/edit" element={<DeviceForm />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
