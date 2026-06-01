// apps/api/src/app/teacher-routine/teacher-routine.dto.ts
export class ClassRoutineResponseDto {
  className: string;
  section: string;
  periodCount: number;
  periods: PeriodRoutineDto[];
}

export class PeriodRoutineDto {
  period: number;
  subject: string;
  subjectId: string;
  teacher: string;
  teacherId: string;
  days: string[];
}

export class TeacherPersonalRoutineDto {
  teacherId: string;
  teacherName: string;
  assignments: TeacherAssignmentDto[];
}

export class TeacherAssignmentDto {
  period: number;
  className: string;
  classId: string;
  section: string;
  subject: string;
  subjectId: string;
  days: string[];
}