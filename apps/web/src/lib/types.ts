// Academic Season
export interface AcademicSeason {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// Class (global)
export interface Class {
  _id: string;
  name: string;
  displayName: string;
  grade: number;
  periodCount: number;
  isActive: boolean;
}

export interface ClassSection {
  _id: string;
  classId: Class | string;
  seasonId: AcademicSeason | string;
  sections: Section[];
}

export interface Section {
  name: string;
  routine: RoutineEntry[][];
}

export interface RoutineEntry {
  subject: string;
  teacher: string;
}

// Student
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

// Academic Record
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

// Enrollment Record
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


export interface Attendance {
  _id: string;
  studentId: Student | string;
  seasonId: AcademicSeason | string;
  classId: Class | string;
  section: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'holiday';
  remarks?: string;
  markedBy?: Teacher | string;
  createdAt?: string;
  updatedAt?: string;
}