// apps/api/src/app/teacher-report/teacher-report.dto.ts
export class AttendanceSummaryDto {
  total: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  attendanceRate: number;
}

export class AbsentStudentDto {
  id: string;
  name: string;
  rollNumber: string;
  reason?: string;
  remarks?: string;
}

export class HealthIssueDto {
  id: string;
  name: string;
  rollNumber: string;
  issues: string[];
  remarks?: string;
}

export class DailyAttendanceReportDto {
  summary: AttendanceSummaryDto;
  absentStudents: AbsentStudentDto[];
  healthIssues: HealthIssueDto[];
  attendance: any[];
}

export class PeriodActivitySummaryDto {
  total: number;
  homeworkComplete: number;
  classworkComplete: number;
  disciplineGood: number;
  healthGood: number;
}

export class StudentWithIssuesDto {
  id: string;
  name: string;
  rollNumber: string;
  healthProblems?: string[];
  disciplineIssue?: string;
  homeworkIssue?: string;
  classworkIssue?: string;
  remarks?: string;
}

export class PeriodActivityReportDto {
  summary: PeriodActivitySummaryDto;
  activities: any[];
  studentsWithIssues: StudentWithIssuesDto[];
}