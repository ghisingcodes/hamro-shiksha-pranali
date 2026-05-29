import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Select, Group, Title, Stack, Loader, Badge, Paper, Text, Center, Alert 
} from '@mantine/core';
import { api } from '../../lib/api';
import { AcademicSeason, Class, ClassSection } from '../../lib/types';

const STATUS_COLORS: Record<string, string> = {
  present: 'green',
  absent: 'red',
  late: 'yellow',
  'half-day': 'orange',
  holiday: 'blue',
};

const STATUS_ABBR: Record<string, string> = {
  present: 'P',
  absent: 'A',
  late: 'L',
  'half-day': 'H',
  holiday: 'Hol',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_OPTIONS = [
  { value: '0', label: 'January' }, { value: '1', label: 'February' }, { value: '2', label: 'March' },
  { value: '3', label: 'April' }, { value: '4', label: 'May' }, { value: '5', label: 'June' },
  { value: '6', label: 'July' }, { value: '7', label: 'August' }, { value: '8', label: 'September' },
  { value: '9', label: 'October' }, { value: '10', label: 'November' }, { value: '11', label: 'December' },
];

const YEAR_OPTIONS = [
  { value: '2023', label: '2023' }, { value: '2024', label: '2024' },
  { value: '2025', label: '2025' }, { value: '2026', label: '2026' },
];

interface MonthlyStudentData {
  _id: string;
  name: string;
  rollNumber: string;
  days: { [key: number]: string };
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  gpa: number;
  percentage: number;
}

interface DailyTotals {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
}

export function MonthlyAttendance() {
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const schoolId = user.schoolId;

  const { data: seasons } = useQuery<AcademicSeason[]>({
    queryKey: ['seasons'],
    queryFn: () => api.get('/academic-seasons').then(res => res.data),
    enabled: !!schoolId,
  });

  const { data: classes } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then(res => res.data),
    enabled: !!schoolId,
  });

  const { data: classSections } = useQuery<ClassSection[]>({
    queryKey: ['classSections', selectedSeasonId],
    queryFn: () => api.get(`/class-sections?seasonId=${selectedSeasonId}`).then(res => res.data),
    enabled: !!selectedSeasonId,
  });

  const getSectionsForClass = useCallback(() => {
    if (!classSections || !selectedClassId) return [];
    const cs = classSections.find(c => {
      const csClassId = typeof c.classId === 'string' ? c.classId : (c.classId as any)?._id;
      return csClassId === selectedClassId;
    });
    return cs?.sections.map(s => ({ value: s.name, label: s.name })) || [];
  }, [classSections, selectedClassId]);

  const month = parseInt(selectedMonth);
  const year = parseInt(selectedYear);
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  const { data: academicRecords, isLoading: studentsLoading } = useQuery({
    queryKey: ['academicRecords', selectedSeasonId, selectedClassId, selectedSection, schoolId],
    queryFn: () => api.get(`/academic-records?seasonId=${selectedSeasonId}&classId=${selectedClassId}&section=${selectedSection}`).then(res => res.data),
    enabled: !!selectedSeasonId && !!selectedClassId && !!selectedSection && !!schoolId,
  });

  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance', selectedSeasonId, selectedClassId, selectedSection, selectedMonth, selectedYear, schoolId],
    queryFn: () => api.get(`/attendance?seasonId=${selectedSeasonId}&classId=${selectedClassId}&section=${selectedSection}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`).then(res => res.data),
    enabled: !!selectedSeasonId && !!selectedClassId && !!selectedSection && !!schoolId,
  });

  const daysInMonth = useMemo(() => {
    const days = [];
    for (let d = 1; d <= endDate.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push({ 
        day: d, 
        weekday: DAY_NAMES[date.getDay()], 
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        fullDate: date
      });
    }
    return days;
  }, [year, month, endDate]);

  // Calculate daily totals
  const dailyTotals: { [key: number]: DailyTotals } = useMemo(() => {
    const totals: { [key: number]: DailyTotals } = {};
    daysInMonth.forEach(day => {
      if (!day.isWeekend) {
        totals[day.day] = { present: 0, absent: 0, late: 0, halfDay: 0 };
      }
    });

    if (attendanceData) {
      attendanceData.forEach((record: any) => {
        const day = new Date(record.date).getDate();
        if (totals[day]) {
          switch (record.status) {
            case 'present': totals[day].present++; break;
            case 'absent': totals[day].absent++; break;
            case 'late': totals[day].late++; break;
            case 'half-day': totals[day].halfDay++; break;
          }
        }
      });
    }
    return totals;
  }, [attendanceData, daysInMonth]);

  const studentData: MonthlyStudentData[] = useMemo(() => {
    if (!academicRecords) return [];

    const attendanceMatrix: { [key: string]: { [key: number]: any } } = {};
    attendanceData?.forEach((record: any) => {
      const studentId = typeof record.studentId === 'string' ? record.studentId : record.studentId._id;
      const day = new Date(record.date).getDate();
      if (!attendanceMatrix[studentId]) attendanceMatrix[studentId] = {};
      attendanceMatrix[studentId][day] = record;
    });

    return academicRecords.map((record: any) => {
      const studentId = typeof record.studentId === 'string' ? record.studentId : record.studentId._id;
      const studentName = typeof record.studentId === 'string' ? 'Loading...' : (record.studentId as any).name;
      const days: { [key: number]: string } = {};
      let present = 0, absent = 0, late = 0, halfDay = 0;
      let totalScore = 0;
      let workingDaysCount = 0;

      daysInMonth.forEach(day => {
        if (day.isWeekend) return;
        workingDaysCount++;
        const attRecord = attendanceMatrix[studentId]?.[day.day];
        if (attRecord) {
          const status = attRecord.status;
          days[day.day] = status;
          switch (status) {
            case 'present': present++; totalScore += 4; break;
            case 'absent': absent++; totalScore += 0; break;
            case 'late': late++; totalScore += 3; break;
            case 'half-day': halfDay++; totalScore += 2; break;
          }
        } else {
          absent++;
          days[day.day] = 'absent';
          totalScore += 0;
        }
      });

      const gpa = workingDaysCount > 0 ? parseFloat((totalScore / workingDaysCount).toFixed(2)) : 0;
      const percentage = workingDaysCount > 0 ? parseFloat(((totalScore / (workingDaysCount * 4)) * 100).toFixed(1)) : 0;

      return {
        _id: studentId,
        name: studentName,
        rollNumber: record.rollNumber,
        days,
        present,
        absent,
        late,
        halfDay,
        gpa,
        percentage,
      };
    });
  }, [academicRecords, attendanceData, daysInMonth]);

  const totalStudents = studentData.length;

  const isLoading = studentsLoading || attendanceLoading;

  if (!schoolId) {
    return <Loader />;
  }

  // Calculate overall totals
  const overallTotals = {
    present: studentData.reduce((sum, s) => sum + s.present, 0),
    absent: studentData.reduce((sum, s) => sum + s.absent, 0),
    late: studentData.reduce((sum, s) => sum + s.late, 0),
    halfDay: studentData.reduce((sum, s) => sum + s.halfDay, 0),
  };

  return (
    <Stack p="md" gap="md">
      <Title order={1}>Monthly Attendance Report</Title>

      <Group grow gap="md">
        <Select
          label="Academic Season"
          placeholder="Select season"
          data={seasons?.map(s => ({ value: s._id, label: s.name })) || []}
          value={selectedSeasonId}
          onChange={(val) => {
            setSelectedSeasonId(val || '');
            setSelectedClassId('');
            setSelectedSection('');
          }}
          clearable
        />
        <Select
          label="Class"
          placeholder="Select class"
          data={classes?.map(c => ({ value: c._id, label: c.displayName })) || []}
          value={selectedClassId}
          onChange={(val) => {
            setSelectedClassId(val || '');
            setSelectedSection('');
          }}
          disabled={!selectedSeasonId}
          clearable
        />
        <Select
          label="Section"
          placeholder="Select section"
          data={getSectionsForClass()}
          value={selectedSection}
          onChange={setSelectedSection}
          disabled={!selectedClassId}
          clearable
        />
        <Select 
          label="Year" 
          data={YEAR_OPTIONS} 
          value={selectedYear} 
          onChange={(val) => setSelectedYear(val || '2025')} 
        />
        <Select 
          label="Month" 
          data={MONTH_OPTIONS} 
          value={selectedMonth} 
          onChange={(val) => setSelectedMonth(val || '0')} 
        />
      </Group>

      {isLoading && <Loader />}

      {!isLoading && studentData.length === 0 && selectedSeasonId && selectedClassId && selectedSection && (
        <Center h={200}>
          <Text c="dimmed">No students found for the selected criteria.</Text>
        </Center>
      )}

      {studentData.length > 0 && (
        <Paper withBorder style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: 800 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8f9fa' }}>
              {/* Header Row 1: Date */}
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th rowSpan={2} style={{ padding: '12px 8px', border: '1px solid #e9ecef', position: 'sticky', left: 0, backgroundColor: '#f8f9fa', zIndex: 11, minWidth: 180, textAlign: 'left' }}>
                  Student Name
                </th>
                <th rowSpan={2} style={{ padding: '12px 8px', border: '1px solid #e9ecef', position: 'sticky', left: 180, backgroundColor: '#f8f9fa', zIndex: 11, minWidth: 80 }}>
                  Roll No
                </th>
                {daysInMonth.map(day => (
                  <th key={`date_${day.day}`} colSpan={1} style={{ padding: '8px 4px', border: '1px solid #e9ecef', textAlign: 'center', backgroundColor: day.isWeekend ? '#ffe8e8' : '#f8f9fa' }}>
                    <div>{day.day}</div>
                    <div style={{ fontSize: 10, color: day.isWeekend ? 'red' : 'gray' }}>{day.weekday}</div>
                  </th>
                ))}
                <th rowSpan={2} style={{ padding: '12px 4px', border: '1px solid #e9ecef', textAlign: 'center', minWidth: 50 }}>P</th>
                <th rowSpan={2} style={{ padding: '12px 4px', border: '1px solid #e9ecef', textAlign: 'center', minWidth: 50 }}>A</th>
                <th rowSpan={2} style={{ padding: '12px 4px', border: '1px solid #e9ecef', textAlign: 'center', minWidth: 50 }}>L</th>
                <th rowSpan={2} style={{ padding: '12px 4px', border: '1px solid #e9ecef', textAlign: 'center', minWidth: 50 }}>H</th>
                <th rowSpan={2} style={{ padding: '12px 4px', border: '1px solid #e9ecef', textAlign: 'center', minWidth: 70 }}>GPA</th>
                <th rowSpan={2} style={{ padding: '12px 4px', border: '1px solid #e9ecef', textAlign: 'center', minWidth: 70 }}>%</th>
              </tr>
              {/* Header Row 2: Status (empty for day columns, just for alignment) */}
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                {daysInMonth.map(day => (
                  <th key={`status_${day.day}`} style={{ padding: '4px 4px', border: '1px solid #e9ecef', textAlign: 'center', fontSize: 11, backgroundColor: day.isWeekend ? '#ffe8e8' : '#f8f9fa' }}>
                    Status
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {studentData.map(student => (
                <tr key={student._id} style={{ borderBottom: '1px solid #e9ecef' }}>
                  <td style={{ padding: '8px 8px', border: '1px solid #e9ecef', position: 'sticky', left: 0, backgroundColor: '#fff', fontWeight: 500, minWidth: 180 }}>
                    {student.name}
                  </td>
                  <td style={{ padding: '8px 8px', border: '1px solid #e9ecef', position: 'sticky', left: 180, backgroundColor: '#fff', minWidth: 80 }}>
                    {student.rollNumber}
                  </td>
                  {daysInMonth.map(day => {
                    const status = student.days[day.day];
                    if (day.isWeekend) {
                      return (
                        <td key={`student_${student._id}_${day.day}`} style={{ padding: '8px 4px', border: '1px solid #e9ecef', textAlign: 'center', backgroundColor: '#fff5f5' }}>
                          —
                        </td>
                      );
                    }
                    return (
                      <td key={`student_${student._id}_${day.day}`} style={{ padding: '8px 4px', border: '1px solid #e9ecef', textAlign: 'center' }}>
                        {status ? (
                          <Badge color={STATUS_COLORS[status] || 'gray'} size="sm" variant="light">
                            {STATUS_ABBR[status] || status.charAt(0).toUpperCase()}
                          </Badge>
                        ) : '—'}
                      </td>
                    );
                  })}
                  <td style={{ padding: '8px 4px', border: '1px solid #e9ecef', textAlign: 'center', fontWeight: 600 }}>{student.present}</td>
                  <td style={{ padding: '8px 4px', border: '1px solid #e9ecef', textAlign: 'center', fontWeight: 600 }}>{student.absent}</td>
                  <td style={{ padding: '8px 4px', border: '1px solid #e9ecef', textAlign: 'center', fontWeight: 600 }}>{student.late}</td>
                  <td style={{ padding: '8px 4px', border: '1px solid #e9ecef', textAlign: 'center', fontWeight: 600 }}>{student.halfDay}</td>
                  <td style={{ padding: '8px 4px', border: '1px solid #e9ecef', textAlign: 'center', fontWeight: 'bold', color: student.gpa >= 3.5 ? 'green' : student.gpa >= 2.5 ? 'orange' : '#d4a017' }}>
                    {student.gpa.toFixed(2)}
                  </td>
                  <td style={{ padding: '8px 4px', border: '1px solid #e9ecef', textAlign: 'center', fontWeight: 'bold', color: student.percentage >= 85 ? 'green' : student.percentage >= 70 ? 'orange' : '#d4a017' }}>
                    {student.percentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot style={{ position: 'sticky', bottom: 0, backgroundColor: '#e9ecef', zIndex: 10 }}>
              {/* Row 1: Present Count per Day */}
              <tr style={{ backgroundColor: '#e8f4f8' }}>
                <td colSpan={2} style={{ padding: '8px 8px', border: '1px solid #dee2e6', fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: '#e9ecef', zIndex: 11 }}>
                  Present Count
                </td>
                {daysInMonth.map(day => {
                  const totals = dailyTotals[day.day];
                  return (
                    <td key={`present_${day.day}`} style={{ padding: '8px 4px', border: '1px solid #dee2e6', textAlign: 'center', backgroundColor: day.isWeekend ? '#fff5f5' : '#e8f4f8' }}>
                      {day.isWeekend ? '—' : (totals?.present || 0)}
                    </td>
                  );
                })}
                <td colSpan={6} style={{ padding: '8px 8px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#e9ecef' }}>
                  Total Present: {overallTotals.present}
                </td>
              </tr>
              {/* Row 2: Absent Count per Day */}
              <tr style={{ backgroundColor: '#ffe8e8' }}>
                <td colSpan={2} style={{ padding: '8px 8px', border: '1px solid #dee2e6', fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: '#e9ecef', zIndex: 11 }}>
                  Absent Count
                </td>
                {daysInMonth.map(day => {
                  const totals = dailyTotals[day.day];
                  return (
                    <td key={`absent_${day.day}`} style={{ padding: '8px 4px', border: '1px solid #dee2e6', textAlign: 'center', backgroundColor: day.isWeekend ? '#fff5f5' : '#ffe8e8' }}>
                      {day.isWeekend ? '—' : (totals?.absent || 0)}
                    </td>
                  );
                })}
                <td colSpan={6} style={{ padding: '8px 8px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#e9ecef' }}>
                  Total Absent: {overallTotals.absent}
                </td>
              </tr>
              {/* Row 3: Late Count per Day */}
              <tr style={{ backgroundColor: '#fff8e1' }}>
                <td colSpan={2} style={{ padding: '8px 8px', border: '1px solid #dee2e6', fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: '#e9ecef', zIndex: 11 }}>
                  Late Count
                </td>
                {daysInMonth.map(day => {
                  const totals = dailyTotals[day.day];
                  return (
                    <td key={`late_${day.day}`} style={{ padding: '8px 4px', border: '1px solid #dee2e6', textAlign: 'center', backgroundColor: day.isWeekend ? '#fff5f5' : '#fff8e1' }}>
                      {day.isWeekend ? '—' : (totals?.late || 0)}
                    </td>
                  );
                })}
                <td colSpan={6} style={{ padding: '8px 8px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#e9ecef' }}>
                  Total Late: {overallTotals.late}
                </td>
              </tr>
              {/* Row 4: Half Day Count per Day */}
              <tr style={{ backgroundColor: '#fce4ec' }}>
                <td colSpan={2} style={{ padding: '8px 8px', border: '1px solid #dee2e6', fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: '#e9ecef', zIndex: 11 }}>
                  Half Day Count
                </td>
                {daysInMonth.map(day => {
                  const totals = dailyTotals[day.day];
                  return (
                    <td key={`half_${day.day}`} style={{ padding: '8px 4px', border: '1px solid #dee2e6', textAlign: 'center', backgroundColor: day.isWeekend ? '#fff5f5' : '#fce4ec' }}>
                      {day.isWeekend ? '—' : (totals?.halfDay || 0)}
                    </td>
                  );
                })}
                <td colSpan={6} style={{ padding: '8px 8px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#e9ecef' }}>
                  Total Half Day: {overallTotals.halfDay}
                </td>
              </tr>
            </tfoot>
          </table>
        </Paper>
      )}
    </Stack>
  );
}