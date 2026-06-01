import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { AcademicsPage } from '../pages/academics/AcademicsPage';
import { ClassRoutinePage } from '../pages/ClassRoutinePage';
import { StudentsPage } from '../pages/students/StudentsPage';
import { TeachersPage } from '../pages/TeachersPage';
import { TeacherSchedulePage } from '../pages/routines/TeacherSchedulePage';

// Portal Pages
import { TeacherDashboard } from '../pages/portals/teacher/TeacherDashboard';
import { StudentAttendance } from '../pages/portals/teacher/StudentAttendance';
import { StudentActivityPage } from '../pages/portals/teacher/StudentActivityPage';
import { StudentDashboard } from '../pages/portals/student/StudentDashboard';
import { ParentDashboard } from '../pages/portals/parent/ParentDashboard';
import { AdminDashboard } from '../pages/portals/admin/AdminDashboard';
import { StaffDashboard } from '../pages/portals/staff/StaffDashboard';

// Attendance Pages
import { DailyAttendance } from '../pages/attendance/DailyAttendance';
import { MonthlyAttendance } from '../pages/attendance/MonthlyAttendance';
import { StudentAttendance as StudentAttendanceReport } from '../pages/attendance/StudentAttendance';

// Other Pages
import { StudentDetailPage } from '../pages/students/StudentDetailPage';
import { EnrollmentPage } from '../pages/enrollment/EnrollmentPage';
import { UsersPage } from '../pages/users/UsersPage';
import { StaffPage } from '../pages/staffs/StaffPage';
import { SchoolSignupPage } from '../pages/auth/SchoolSignupPage';
import { SchoolLoginPage } from '../pages/auth/SchoolLoginPage';
import { SchoolSuperAdminLoginPage } from '../pages/auth/SchoolSuperAdminLoginPage';
import { SchoolNotFoundPage } from '../pages/auth/SchoolNotFoundPage';

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
  
  // Redirect based on user role
  if (user.userType === 'teacher' || user.role === 'teacher') {
    return <Navigate to={`/${schoolSlug}/teacher/dashboard`} replace />;
  }
  if (user.userType === 'student' || user.role === 'student') {
    return <Navigate to={`/${schoolSlug}/student/dashboard`} replace />;
  }
  if (user.userType === 'parent' || user.role === 'parent') {
    return <Navigate to={`/${schoolSlug}/parent/dashboard`} replace />;
  }
  if (user.userType === 'staff' || user.role === 'staff') {
    return <Navigate to={`/${schoolSlug}/staff/dashboard`} replace />;
  }
  
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
        
        {/* ==================== SCHOOL ADMIN PORTAL ==================== */}
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
              <StudentAttendanceReport />
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
        
        {/* ==================== TEACHER PORTAL ==================== */}
        <Route path="/:slug/teacher/dashboard" element={
          <SchoolProtectedRoute requiredRole="teacher">
            <Layout>
              <TeacherDashboard />
            </Layout>
          </SchoolProtectedRoute>
        } />
        
        <Route path="/:slug/teacher/attendance" element={
          <SchoolProtectedRoute requiredRole="teacher">
            <Layout>
              <StudentAttendance />
            </Layout>
          </SchoolProtectedRoute>
        } />
        
        <Route path="/:slug/teacher/attendance/:classId/:section" element={
          <SchoolProtectedRoute requiredRole="teacher">
            <Layout>
              <StudentAttendance />
            </Layout>
          </SchoolProtectedRoute>
        } />
        
        <Route path="/:slug/teacher/activities" element={
          <SchoolProtectedRoute requiredRole="teacher">
            <Layout>
              <StudentActivityPage />
            </Layout>
          </SchoolProtectedRoute>
        } />
        
        <Route path="/:slug/teacher/activities/:period" element={
          <SchoolProtectedRoute requiredRole="teacher">
            <Layout>
              <StudentActivityPage />
            </Layout>
          </SchoolProtectedRoute>
        } />
        
        <Route path="/:slug/teacher/schedule" element={
          <SchoolProtectedRoute requiredRole="teacher">
            <Layout>
              <TeacherSchedulePage />
            </Layout>
          </SchoolProtectedRoute>
        } />
        
        <Route path="/:slug/teacher/students" element={
          <SchoolProtectedRoute requiredRole="teacher">
            <Layout>
              <StudentsPage />
            </Layout>
          </SchoolProtectedRoute>
        } />
        
        {/* ==================== STUDENT PORTAL ==================== */}
        <Route path="/:slug/student/dashboard" element={
          <SchoolProtectedRoute requiredRole="student">
            <Layout>
              <StudentDashboard />
            </Layout>
          </SchoolProtectedRoute>
        } />
        
        <Route path="/:slug/student/attendance" element={
          <SchoolProtectedRoute requiredRole="student">
            <Layout>
              <StudentAttendanceReport />
            </Layout>
          </SchoolProtectedRoute>
        } />
        
        <Route path="/:slug/student/routine" element={
          <SchoolProtectedRoute requiredRole="student">
            <Layout>
              <ClassRoutinePage />
            </Layout>
          </SchoolProtectedRoute>
        } />
        
        {/* ==================== PARENT PORTAL ==================== */}
        <Route path="/:slug/parent/dashboard" element={
          <SchoolProtectedRoute requiredRole="parent">
            <Layout>
              <ParentDashboard />
            </Layout>
          </SchoolProtectedRoute>
        } />
        
        <Route path="/:slug/parent/children" element={
          <SchoolProtectedRoute requiredRole="parent">
            <Layout>
              <StudentsPage />
            </Layout>
          </SchoolProtectedRoute>
        } />
        
        <Route path="/:slug/parent/attendance" element={
          <SchoolProtectedRoute requiredRole="parent">
            <Layout>
              <StudentAttendanceReport />
            </Layout>
          </SchoolProtectedRoute>
        } />
        
        {/* ==================== STAFF PORTAL ==================== */}
        <Route path="/:slug/staff/dashboard" element={
          <SchoolProtectedRoute requiredRole="staff">
            <Layout>
              <StaffDashboard />
            </Layout>
          </SchoolProtectedRoute>
        } />
        
        {/* ==================== SUPER ADMIN ROUTES (no school slug) ==================== */}
        <Route path="/super-admin/dashboard" element={
          <SchoolProtectedRoute requiredRole="super_admin">
            <Layout>
              <AdminDashboard />
            </Layout>
          </SchoolProtectedRoute>
        } />
        
        <Route path="/super-admin/schools" element={
          <SchoolProtectedRoute requiredRole="super_admin">
            <Layout>
              <div>Schools Management Page</div>
            </Layout>
          </SchoolProtectedRoute>
        } />
        
        <Route path="/super-admin/users" element={
          <SchoolProtectedRoute requiredRole="super_admin">
            <Layout>
              <UsersPage />
            </Layout>
          </SchoolProtectedRoute>
        } />
        
        {/* ==================== ROOT AND LEGACY REDIRECTS ==================== */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/" element={<Navigate to="/signup" replace />} />
        
        {/* 404 Fallback */}
        <Route path="*" element={
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <h2>404 - Page Not Found</h2>
            <p>The page you are looking for does not exist.</p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}