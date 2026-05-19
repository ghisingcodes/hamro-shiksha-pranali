import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { AcademicsPage } from '../pages/academics/AcademicsPage';
import { ClassRoutinePage } from '../pages/ClassRoutinePage';
import { StudentsPage } from '../pages/StudentsPage';
import { TeachersPage } from '../pages/TeachersPage';
import { TeacherSchedulePage } from '../pages/TeacherSchedulePage';

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
          <Route path="/teachers" element={<TeachersPage />} />
          <Route path="/teacher-schedule" element={<TeacherSchedulePage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}