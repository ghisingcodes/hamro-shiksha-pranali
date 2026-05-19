export interface Class {
  _id: string;
  name: string;
  displayName: string;
  grade: number;
  periodCount: number;
}

export interface AcademicSeason {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Section {
  name: string;
  routine: { subject: string; teacher: string }[][];
}

export interface ClassSection {
  _id: string;
  classId: Class | string;
  seasonId: AcademicSeason | string;
  sections: Section[];
}

export interface Student {
  _id: string;
  name: string;
  rollNumber: string;
  seasonId: string;
  classId: string;
  section: string;
  parentPhone?: string;
  address?: string;
}

export interface Teacher {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subjects: string[];
}