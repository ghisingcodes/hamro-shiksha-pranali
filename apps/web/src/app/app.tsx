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
import { UsersPage } from '../pages/users/UsersPage';
import { StaffPage } from '../pages/staffs/StaffPage';
import { SchoolSignupPage } from '../pages/auth/SchoolSignupPage';
import { SchoolLoginPage } from '../pages/auth/SchoolLoginPage';
import { SchoolSuperAdminLoginPage } from '../pages/auth/SchoolSuperAdminLoginPage';
import { SchoolNotFoundPage } from '../pages/auth/SchoolNotFoundPage';

// Portal Pages
import { StudentDashboard } from '../pages/portals/student/StudentDashboard';
import { TeacherDashboard } from '../pages/portals/teacher/TeacherDashboard';
import { ParentDashboard } from '../pages/portals/parent/ParentDashboard';
import { AdminDashboard } from '../pages/portals/admin/AdminDashboard';
import { StaffDashboard } from '../pages/portals/staff/StaffDashboard';

// Protected route wrapper for school portals
const SchoolProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    const currentSlug = window.location.pathname.split('/')[1];
    return <Navigate to={`/${currentSlug}/login`} replace />;
  }
  
  if (requiredRole && user.userType !== requiredRole && user.role !== requiredRole) {
    const currentSlug = window.location.pathname.split('/')[1];
    return <Navigate to={`/${currentSlug}/login`} replace />;
  }
  
  return <>{children}</>;
};

// Admin route wrapper for school admin
const SchoolAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const currentSlug = window.location.pathname.split('/')[1];
  
  if (!token) return <Navigate to={`/${currentSlug}/super-admin/login`} replace />;
  if (user.userType !== 'school_admin' && user.userType !== 'super_admin') {
    return <Navigate to={`/${currentSlug}/login`} replace />;
  }
  return <>{children}</>;
};

function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const schoolSlug = localStorage.getItem('schoolSlug');
  const schoolName = localStorage.getItem('schoolName');
  
  return (
    <div>
      <h2>Welcome to {schoolName || 'Hamro Shiksha Pranali'}</h2>
      <p>Logged in as: <strong>{user.name}</strong> ({user.userType || user.role})</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/signup" element={<SchoolSignupPage />} />
        <Route path="/school-not-found" element={<SchoolNotFoundPage />} />
        
        {/* School-based Login Routes */}
        <Route path="/:slug/login" element={<SchoolLoginPage />} />
        <Route path="/:slug/super-admin/login" element={<SchoolSuperAdminLoginPage />} />
        
        {/* School Admin Portal (with Layout) */}
        <Route path="/:slug/admin/dashboard" element={
          <SchoolAdminRoute>
            <Layout>
              <AdminDashboard />
            </Layout>
          </SchoolAdminRoute>
        } />
        
        <Route path="/:slug/admin/academics" element={
          <SchoolAdminRoute>
            <Layout>
              <AcademicsPage />
            </Layout>
          </SchoolAdminRoute>
        } />
        
        <Route path="/:slug/admin/class-routine" element={
          <SchoolAdminRoute>
            <Layout>
              <ClassRoutinePage />
            </Layout>
          </SchoolAdminRoute>
        } />
        
        <Route path="/:slug/admin/students" element={
          <SchoolAdminRoute>
            <Layout>
              <StudentsPage />
            </Layout>
          </SchoolAdminRoute>
        } />
        
        <Route path="/:slug/admin/students/:id" element={
          <SchoolAdminRoute>
            <Layout>
              <StudentDetailPage />
            </Layout>
          </SchoolAdminRoute>
        } />
        
        <Route path="/:slug/admin/teachers" element={
          <SchoolAdminRoute>
            <Layout>
              <TeachersPage />
            </Layout>
          </SchoolAdminRoute>
        } />
        
        <Route path="/:slug/admin/teacher-schedule" element={
          <SchoolAdminRoute>
            <Layout>
              <TeacherSchedulePage />
            </Layout>
          </SchoolAdminRoute>
        } />
        
        <Route path="/:slug/admin/attendance/daily" element={
          <SchoolAdminRoute>
            <Layout>
              <DailyAttendance />
            </Layout>
          </SchoolAdminRoute>
        } />
        
        <Route path="/:slug/admin/attendance/monthly" element={
          <SchoolAdminRoute>
            <Layout>
              <MonthlyAttendance />
            </Layout>
          </SchoolAdminRoute>
        } />
        
        <Route path="/:slug/admin/attendance/student" element={
          <SchoolAdminRoute>
            <Layout>
              <StudentAttendance />
            </Layout>
          </SchoolAdminRoute>
        } />
        
        <Route path="/:slug/admin/student-activities" element={
          <SchoolAdminRoute>
            <Layout>
              <StudentActivityPage />
            </Layout>
          </SchoolAdminRoute>
        } />
        
        <Route path="/:slug/admin/enrollment" element={
          <SchoolAdminRoute>
            <Layout>
              <EnrollmentPage />
            </Layout>
          </SchoolAdminRoute>
        } />
        
        <Route path="/:slug/admin/users" element={
          <SchoolAdminRoute>
            <Layout>
              <UsersPage />
            </Layout>
          </SchoolAdminRoute>
        } />
        
        <Route path="/:slug/admin/staff" element={
          <SchoolAdminRoute>
            <Layout>
              <StaffPage />
            </Layout>
          </SchoolAdminRoute>
        } />
        
        {/* Teacher Portal */}
        <Route path="/:slug/teacher/dashboard" element={
          <SchoolProtectedRoute requiredRole="teacher">
            <Layout>
              <TeacherDashboard />
            </Layout>
          </SchoolProtectedRoute>
        } />
        
        {/* Student Portal */}
        <Route path="/:slug/student/dashboard" element={
          <SchoolProtectedRoute requiredRole="student">
            <Layout>
              <StudentDashboard />
            </Layout>
          </SchoolProtectedRoute>
        } />
        
        {/* Parent Portal */}
        <Route path="/:slug/parent/dashboard" element={
          <SchoolProtectedRoute requiredRole="parent">
            <Layout>
              <ParentDashboard />
            </Layout>
          </SchoolProtectedRoute>
        } />
        
        {/* Staff Portal */}
        <Route path="/:slug/staff/dashboard" element={
          <SchoolProtectedRoute requiredRole="staff">
            <Layout>
              <StaffDashboard />
            </Layout>
          </SchoolProtectedRoute>
        } />
        
        {/* Super Admin Routes (no school slug) */}
        <Route path="/super-admin/dashboard" element={
          <SchoolProtectedRoute requiredRole="super_admin">
            <Layout>
              <AdminDashboard />
            </Layout>
          </SchoolProtectedRoute>
        } />
        
        {/* Legacy redirects (for backward compatibility) */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/" element={<Navigate to="/signup" replace />} />
      </Routes>
    </BrowserRouter>
  );
}