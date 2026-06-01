// ==================== Academic Types ====================
export interface AcademicSeason {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Class {
  _id: string;
  name: string;
  displayName: string;
  grade: number;
  periodCount: number;
  isActive: boolean;
}

export interface Subject {
  _id: string;
  name: string;
  code?: string;
  classId: string;
  seasonId: string;
  schoolId: string;
  isActive: boolean;
}

export interface RoutineEntry {
  subject: string;
  teacher: string;
}

export interface Section {
  name: string;
  routine: RoutineEntry[][];
}

export interface ClassSection {
  _id: string;
  classId: Class | string;
  seasonId: AcademicSeason | string;
  sections: Section[];
}

// Add to your types.ts
export interface SectionDocument {
  _id: string;
  classId: string | Class;
  seasonId: string | AcademicSeason;
  schoolId: string;
  name: string;
  currentClassTeacherId?: string;
  currentClassTeacherSubjectId?: string;
  classTeacherHistory: Array<{
    teacherId: string;
    subjectId: string;
    assignedDate: string;
    endDate: string | null;
    reason: string;
  }>;
  periodTeachers: Record<string, Array<{
    teacherId: string;
    subjectId: string;
    days: string[];
    assignedDate: string;
    endDate: string | null;
    reason: string;
  }>>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== Student Types ====================
export interface Parent {
  id?: string;
  relation: string;
  name: string;
  phone: string;
  email?: string;
  occupation?: string;
  workplace?: string;
  monthlyIncome?: number;
  yearlyIncome?: number;
  education?: string;
  contactPreference?: string;
  isPrimary?: boolean;
}

export interface Student {
  _id: string;
  studentId: string;
  name: string;
  dateOfBirth?: string;
  gender?: string;
  liveWith?: string;
  longTermHealth?: string[];
  abnormalBehaviour?: string[];
  mobileAccess?: string;
  internetAccess?: string;
  parents?: Parent[];
  permanentAddress?: string;
  temporaryAddress?: string;
  sameAddress?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== Academic Record Types ====================
export interface AcademicRecord {
  _id: string;
  studentId: Student | string;
  seasonId: AcademicSeason | string;
  classId: Class | string;
  section: string;
  rollNumber?: string;
  status: 'active' | 'promoted' | 'failed' | 'repeated' | 'left' | 'graduated';
  previousAcademicRecordId?: string;
  nextAcademicRecordId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== Enrollment Record Types ====================
export interface EnrollmentRecord {
  _id: string;
  studentId: Student | string;
  seasonId: AcademicSeason | string;
  classId: Class | string;
  section: string;
  rollNumber?: string;
  status: 'active' | 'promoted' | 'failed' | 'repeated' | 'left' | 'graduated';
  admissionFee: number;
  tuitionFee: number;
  examFee: number;
  otherFees: number;
  totalFees: number;
  paidAmount: number;
  dueAmount: number;
  admissionDate?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== Teacher Types ====================
export interface Teacher {
  _id: string;
  teacherId: string;
  name: string;
  phone?: string;
  email?: string;
  qualification?: string;
  experience?: number;
  subjects: string[];
  employmentType?: string;
  status?: string;
  userId?: { _id: string; email: string; name: string } | null;
  contractEndDate?: string;
  lastWorkingDate?: string;
  reasonForLeave?: string;
  isActive: boolean;
}

// ==================== Attendance Types ====================
export interface Attendance {
  _id: string;
  studentId: Student | string;
  seasonId: AcademicSeason | string;
  classId: Class | string;
  section: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'holiday';
  absentReason?: string;
  hygieneIssues?: string[];
  remarks?: string;
  markedBy?: Teacher | string;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== Student Activity Types ====================
export interface StudentActivity {
  _id: string;
  studentId: Student | string;
  seasonId: AcademicSeason | string;
  classId: Class | string;
  section: string;
  period: number;
  date: string;
  homeworkStatus?: string;
  homeworkIssue?: string;
  classworkStatus?: string;
  classworkIssue?: string;
  disciplineStatus?: string;
  disciplineIssue?: string;
  healthStatus?: string;
  healthProblems?: string[];
  practicalStatus?: string;
  readingStatus?: string;
  writingStatus?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== User Types ====================
export interface User {
  _id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'super_admin' | 'school_admin' | 'admin' | 'teacher' | 'staff' | 'parent';
  schoolId?: string;
  teacherId?: string;
  staffId?: string;
  isActive: boolean;
  lastLogin?: string;
  permissions: string[];
  profilePicture?: string;
}

// ==================== Staff Types ====================
export interface Staff {
  _id: string;
  staffId: string;
  name: string;
  phone?: string;
  email?: string;
  position?: string;
  department?: string;
  joiningDate?: string;
  salary?: number;
  address?: string;
  emergencyContact?: string;
  isActive: boolean;
}

// ==================== School Types ====================
export interface School {
  _id: string;
  schoolId: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  panNumber?: string;
  registrationNumber?: string;
  establishedYear?: number;
  principalName?: string;
  vicePrincipalName?: string;
  website?: string;
  schoolLogo?: string;
  coverPhoto?: string;
  themeColor?: string;
  isActive: boolean;
}

// ==================== Helper Types for Filters ====================
export interface AttendanceFilter {
  seasonId?: string;
  classId?: string;
  section?: string;
  startDate?: string;
  endDate?: string;
  studentId?: string;
}

export interface AcademicRecordFilter {
  studentId?: string;
  seasonId?: string;
  classId?: string;
  section?: string;
}

export interface TeacherFilter {
  schoolId?: string;
  seasonId?: string;
  isActive?: boolean;
}