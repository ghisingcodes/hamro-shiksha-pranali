import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, Group, Title, Stack, Loader, Badge, Paper, Text, Center, Tooltip } from '@mantine/core';
import { createColumnHelper, useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
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
  percentage: string;
}

export function MonthlyAttendance() {
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const { data: seasons } = useQuery<AcademicSeason[]>({
    queryKey: ['seasons'],
    queryFn: () => api.get('/academic-seasons').then(res => res.data),
  });

  const { data: classes } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then(res => res.data),
  });

  const { data: classSections } = useQuery<ClassSection[]>({
    queryKey: ['classSections', selectedSeasonId],
    queryFn: () => api.get(`/class-sections?seasonId=${selectedSeasonId}`).then(res => res.data),
    enabled: !!selectedSeasonId,
  });

  const getSectionsForClass = () => {
    if (!classSections || !selectedClassId) return [];
    const cs = classSections.find(c => {
      const csClassId = typeof c.classId === 'string' ? c.classId : (c.classId as any)?._id;
      return csClassId === selectedClassId;
    });
    return cs?.sections.map(s => ({ value: s.name, label: s.name })) || [];
  };

  const month = parseInt(selectedMonth);
  const year = parseInt(selectedYear);
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance', selectedSeasonId, selectedClassId, selectedSection, selectedMonth, selectedYear],
    queryFn: () => api.get(`/attendance?seasonId=${selectedSeasonId}&classId=${selectedClassId}&section=${selectedSection}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`).then(res => res.data),
    enabled: !!selectedSeasonId && !!selectedClassId && !!selectedSection,
  });

  const { data: academicRecords, isLoading: studentsLoading } = useQuery({
    queryKey: ['academicRecords', selectedSeasonId, selectedClassId, selectedSection],
    queryFn: () => api.get(`/academic-records?seasonId=${selectedSeasonId}&classId=${selectedClassId}&section=${selectedSection}`).then(res => res.data),
    enabled: !!selectedSeasonId && !!selectedClassId && !!selectedSection,
  });

  // Get days in month
  const daysInMonth = [];
  for (let d = 1; d <= endDate.getDate(); d++) {
    const date = new Date(year, month, d);
    daysInMonth.push({ day: d, weekday: DAY_NAMES[date.getDay()], isWeekend: date.getDay() === 0 || date.getDay() === 6 });
  }

  // Build attendance matrix and student data
  const studentData: MonthlyStudentData[] = useMemo(() => {
    if (!academicRecords) return [];

    // Build attendance matrix
    const attendanceMatrix: { [key: string]: { [key: number]: any } } = {};
    attendanceData?.forEach((record: any) => {
      const studentId = typeof record.studentId === 'string' ? record.studentId : record.studentId._id;
      const day = new Date(record.date).getDate();
      if (!attendanceMatrix[studentId]) attendanceMatrix[studentId] = {};
      attendanceMatrix[studentId][day] = record;
    });

    // Build student list
    return academicRecords.map((record: any) => {
      const studentId = typeof record.studentId === 'string' ? record.studentId : record.studentId._id;
      const days: { [key: number]: string } = {};
      let present = 0, absent = 0, late = 0, halfDay = 0;
      
      daysInMonth.forEach(day => {
        if (day.isWeekend) return;
        const attRecord = attendanceMatrix[studentId]?.[day.day];
        if (attRecord) {
          const status = attRecord.status;
          days[day.day] = status;
          switch (status) {
            case 'present': present++; break;
            case 'absent': absent++; break;
            case 'late': late++; break;
            case 'half-day': halfDay++; break;
          }
        } else {
          absent++;
          days[day.day] = 'absent';
        }
      });
      
      const workingDays = daysInMonth.filter(d => !d.isWeekend).length;
      const percentage = workingDays > 0 ? ((present + late * 0.5 + halfDay * 0.5) / workingDays * 100).toFixed(1) : 0;
      
      return {
        _id: studentId,
        name: typeof record.studentId === 'string' ? 'Loading...' : (record.studentId as any).name,
        rollNumber: record.rollNumber,
        days,
        present,
        absent,
        late,
        halfDay,
        percentage,
      };
    });
  }, [academicRecords, attendanceData, daysInMonth]);

  // Build dynamic columns
  const columnHelper = createColumnHelper<MonthlyStudentData>();
  const columns = useMemo(() => {
    const staticColumns = [
      columnHelper.accessor('name', { header: 'Student', size: 180 }),
      columnHelper.accessor('rollNumber', { header: 'Roll No', size: 80 }),
    ];
    
    const dayColumns = daysInMonth.map(day => 
      columnHelper.accessor(row => row.days[day.day], {
        id: `day_${day.day}`,
        header: () => (
          <div style={{ textAlign: 'center' }}>
            <div>{day.day}</div>
            <div style={{ fontSize: 10, color: day.isWeekend ? 'red' : 'gray' }}>{day.weekday}</div>
          </div>
        ),
        cell: (info) => {
          const status = info.getValue();
          return (
            <Tooltip label={status} withArrow position="top">
              <Badge color={STATUS_COLORS[status] || 'gray'} size="sm" variant="light">
                {STATUS_ABBR[status] || status?.charAt(0).toUpperCase()}
              </Badge>
            </Tooltip>
          );
        },
        size: 50,
      })
    );
    
    const summaryColumns = [
      columnHelper.accessor('present', { header: 'P', size: 50, cell: info => <div style={{ textAlign: 'center' }}>{info.getValue()}</div> }),
      columnHelper.accessor('absent', { header: 'A', size: 50, cell: info => <div style={{ textAlign: 'center' }}>{info.getValue()}</div> }),
      columnHelper.accessor('late', { header: 'L', size: 50, cell: info => <div style={{ textAlign: 'center' }}>{info.getValue()}</div> }),
      columnHelper.accessor('halfDay', { header: 'H', size: 50, cell: info => <div style={{ textAlign: 'center' }}>{info.getValue()}</div> }),
      columnHelper.accessor('percentage', { 
        header: '%', 
        size: 70,
        cell: info => {
          const val = parseFloat(info.getValue());
          return <div style={{ textAlign: 'center', fontWeight: 'bold', color: val >= 75 ? 'green' : val >= 50 ? 'orange' : 'red' }}>{info.getValue()}%</div>;
        }
      }),
    ];
    
    return [...staticColumns, ...dayColumns, ...summaryColumns];
  }, [daysInMonth]);

  const table = useReactTable({
    data: studentData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const isLoading = attendanceLoading || studentsLoading;

  return (
    <Stack p="md">
      <Title order={1}>Monthly Attendance Report</Title>
      
      <Group grow>
        <Select
          label="Academic Season"
          placeholder="Select season"
          data={seasons?.map(s => ({ value: s._id, label: s.name })) || []}
          value={selectedSeasonId}
          onChange={(val) => setSelectedSeasonId(val || '')}
        />
        <Select
          label="Class"
          placeholder="Select class"
          data={classes?.map(c => ({ value: c._id, label: c.displayName })) || []}
          value={selectedClassId}
          onChange={(val) => setSelectedClassId(val || '')}
          disabled={!selectedSeasonId}
        />
        <Select
          label="Section"
          placeholder="Select section"
          data={getSectionsForClass()}
          value={selectedSection}
          onChange={setSelectedSection}
          disabled={!selectedClassId}
        />
      </Group>

      <Group grow>
        <Select label="Year" data={YEAR_OPTIONS} value={selectedYear} onChange={(val) => setSelectedYear(val || '2025')} />
        <Select label="Month" data={MONTH_OPTIONS} value={selectedMonth} onChange={(val) => setSelectedMonth(val || '0')} />
      </Group>

      {isLoading && <Loader />}
      
      {!isLoading && studentData.length === 0 && selectedSeasonId && selectedClassId && selectedSection && (
        <Center h={200}><Text c="dimmed">No attendance records found for the selected criteria.</Text></Center>
      )}
      
      {studentData.length > 0 && (
        <Paper withBorder style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #e9ecef', backgroundColor: '#f8f9fa', width: header.getSize() }}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} style={{ padding: '8px', borderBottom: '1px solid #e9ecef' }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Paper>
      )}
    </Stack>
  );
}