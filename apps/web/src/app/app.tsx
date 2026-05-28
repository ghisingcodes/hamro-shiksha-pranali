import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { AcademicsPage } from '../pages/academics/AcademicsPage';
import { ClassRoutinePage } from '../pages/ClassRoutinePage';
import { StudentsPage } from '../pages/students/StudentsPage';
import { TeachersPage } from '../pages/TeachersPage';
import { TeacherSchedulePage } from '../pages/routines/TeacherSchedulePage';
import { StudentDetailPage } from '../pages/students/StudentDetailPage';
import { DailyAttendance, MonthlyAttendance, StudentAttendance } from '../pages/attendance';
import { StudentActivityPage } from '../pages/student-activity/StudentActivityPage';
import { EnrollmentPage } from '../pages/enrollment/EnrollmentPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { UsersPage } from '../pages/users/UsersPage';
import { StaffPage } from '../pages/staffs/StaffPage';
import { SchoolSignupPage } from '../pages/auth/SchoolSignupPage';

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// Role-based route wrapper (optional)
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  if (user.role !== 'super_admin' && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return (
    <div>
      <h2>Welcome to Hamro Shiksha Pranali</h2>
      <p>Logged in as: <strong>{user.name}</strong> ({user.role})</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SchoolSignupPage />} />
        {/* Protected Routes with Layout */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/academics" element={
          <ProtectedRoute>
            <Layout>
              <AcademicsPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/class-routine" element={
          <ProtectedRoute>
            <Layout>
              <ClassRoutinePage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/students" element={
          <ProtectedRoute>
            <Layout>
              <StudentsPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/students/:id" element={
          <ProtectedRoute>
            <Layout>
              <StudentDetailPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/teachers" element={
          <ProtectedRoute>
            <Layout>
              <TeachersPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/teacher-schedule" element={
          <ProtectedRoute>
            <Layout>
              <TeacherSchedulePage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/attendance/daily" element={
          <ProtectedRoute>
            <Layout>
              <DailyAttendance />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/attendance/monthly" element={
          <ProtectedRoute>
            <Layout>
              <MonthlyAttendance />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/attendance/student" element={
          <ProtectedRoute>
            <Layout>
              <StudentAttendance />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/student-activities" element={
          <ProtectedRoute>
            <Layout>
              <StudentActivityPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/enrollment" element={
          <ProtectedRoute>
            <Layout>
              <EnrollmentPage />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Admin Only Routes */}
        <Route path="/users" element={
          <AdminRoute>
            <Layout>
              <UsersPage />
            </Layout>
          </AdminRoute>
        } />
        
        <Route path="/staff" element={
          <AdminRoute>
            <Layout>
              <StaffPage />
            </Layout>
          </AdminRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}