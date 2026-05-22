import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { AcademicsPage } from '../pages/academics/AcademicsPage';
import { ClassRoutinePage } from '../pages/ClassRoutinePage';
import { StudentsPage } from '../pages/students/StudentsPage';
import { TeachersPage } from '../pages/TeachersPage';
import { TeacherSchedulePage } from '../pages/TeacherSchedulePage';
import { StudentDetailPage } from '../pages/students/StudentDetailPage';
import { DailyAttendance, MonthlyAttendance, StudentAttendance } from '../pages/attendance';
import { EnrollmentPage } from '../pages/enrollment/EnrollmentPage';

function Dashboard() {
  return <div>Welcome to Hamro Shiksha Pranali</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/academics" element={<AcademicsPage />} />
          <Route path="/class-routine" element={<ClassRoutinePage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/students/:id" element={<StudentDetailPage />} />
          <Route path="/teachers" element={<TeachersPage />} />
          <Route path="/teacher-schedule" element={<TeacherSchedulePage />} />
          <Route path="/attendance/daily" element={<DailyAttendance />} />
          <Route path="/attendance/monthly" element={<MonthlyAttendance />} />
          <Route path="/attendance/student" element={<StudentAttendance />} />
          <Route path="/enrollment" element={<EnrollmentPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}