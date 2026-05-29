import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Select, Button, Group, Title, Stack, Loader, Alert, Badge, 
  Textarea, Paper, MultiSelect, Text, ActionIcon, Tooltip, Card, 
  Divider, SimpleGrid, Grid, Drawer, Avatar
} from '@mantine/core';
import { createColumnHelper, useReactTable, getCoreRowModel, getPaginationRowModel } from '@tanstack/react-table';
import { 
  IconRefresh, IconUserX, 
  IconTrophy, IconMoodSad, IconPhone, IconMail, IconMapPin, 
  IconHeartbeat, IconMoodX, IconDeviceMobile, IconWifi, IconBriefcase, IconUser 
} from '@tabler/icons-react';
import { api } from '../../lib/api';
import { AcademicSeason, Class, ClassSection, Student } from '../../lib/types';
import { notifications } from '@mantine/notifications';
import { DataTable } from '../../components/DataTable';

const ABSENT_REASONS = [
  { value: 'sick', label: '🤒 Sick' },
  { value: 'family_event', label: '👨‍👩‍👧 Family Event' },
  { value: 'holiday', label: '🏖️ Holiday' },
  { value: 'late_registration', label: '⏰ Late Registration' },
  { value: 'transport_issue', label: '🚌 Transport Issue' },
  { value: 'no_uniform', label: '👕 No Uniform' },
  { value: 'uninformed', label: '📞 Uninformed Absence' },
  { value: 'school_event', label: '🏫 School Event' },
  { value: 'exam_prep', label: '📝 Exam Preparation' },
  { value: 'other', label: '📌 Other' },
];

const HYGIENE_ISSUES = [
  { value: 'no_tie', label: 'No Tie' },
  { value: 'no_belt', label: 'No Belt' },
  { value: 'dirty_shirt', label: 'Dirty Shirt' },
  { value: 'dirty_pants', label: 'Dirty Pants' },
  { value: 'uncombed_hair', label: 'Uncombed Hair' },
  { value: 'dirty_shoes', label: 'Dirty Shoes' },
  { value: 'long_nails', label: 'Long Nails' },
  { value: 'no_id_card', label: 'No ID Card' },
  { value: 'improper_uniform', label: 'Improper Uniform' },
  { value: 'strong_odor', label: 'Strong Odor' },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface AttendanceRow {
  studentId: string;
  studentName: string;
  rollNumber: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  absentReason: string;
  hygieneIssues: string[];
  remarks: string;
}

export function DailyAttendance() {
  const queryClient = useQueryClient();
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate().toString());
  const [attendanceData, setAttendanceData] = useState<AttendanceRow[]>([]);
  const [originalData, setOriginalData] = useState<AttendanceRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [drawerOpened, setDrawerOpened] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const remarksTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const schoolId = user.schoolId;

  const selectedDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, parseInt(selectedDay));
  const dayOfWeek = DAYS[selectedDate.getDay()];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
  const daysInMonth = getDaysInMonth(parseInt(selectedYear), parseInt(selectedMonth));
  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => ({ value: (i + 1).toString(), label: (i + 1).toString() }));
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => ({ value: (currentYear - 5 + i).toString(), label: (currentYear - 5 + i).toString() }));
  const monthOptions = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
    { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
    { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];

  // Fetch data
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

  const getSectionsForClass = () => {
    if (!classSections || !selectedClassId) return [];
    const cs = classSections.find(c => {
      const csClassId = typeof c.classId === 'string' ? c.classId : (c.classId as any)?._id;
      return csClassId === selectedClassId;
    });
    return cs?.sections.map(s => ({ value: s.name, label: s.name })) || [];
  };

  // Fetch filtered students
  const { data: academicRecords, isLoading: studentsLoading, refetch: refetchStudents } = useQuery({
    queryKey: ['academicRecords', selectedSeasonId, selectedClassId, selectedSection],
    queryFn: async () => {
      if (!selectedSeasonId || !selectedClassId || !selectedSection) return [];
      const response = await api.get(`/academic-records`, {
        params: {
          seasonId: selectedSeasonId,
          classId: selectedClassId,
          section: selectedSection
        }
      });
      return response.data;
    },
    enabled: !!selectedSeasonId && !!selectedClassId && !!selectedSection && !!schoolId,
  });

  // Fetch student details for drawer
  const fetchStudentDetails = async (studentId: string) => {
    try {
      const response = await api.get(`/students/${studentId}`);
      setSelectedStudent(response.data);
      setDrawerOpened(true);
    } catch (error) {
      console.error('Failed to fetch student details:', error);
      notifications.show({ title: 'Error', message: 'Failed to load student details', color: 'red' });
    }
  };

  // Get all attendance records for the current month to calculate top performers
  const { data: monthlyAttendance } = useQuery({
    queryKey: ['monthlyAttendance', selectedSeasonId, selectedClassId, selectedSection, selectedYear, selectedMonth],
    queryFn: async () => {
      if (!selectedSeasonId || !selectedClassId || !selectedSection) return [];
      const startDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1);
      const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0);
      const response = await api.get(`/attendance`, {
        params: {
          seasonId: selectedSeasonId,
          classId: selectedClassId,
          section: selectedSection,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      return response.data;
    },
    enabled: !!selectedSeasonId && !!selectedClassId && !!selectedSection && !!schoolId,
  });

  // Get existing attendance for the selected date
  const { data: existingAttendance, refetch: refetchAttendance } = useQuery({
    queryKey: ['attendance', selectedSeasonId, selectedClassId, selectedSection, selectedYear, selectedMonth, selectedDay],
    queryFn: async () => {
      if (!selectedSeasonId || !selectedClassId || !selectedSection) return [];
      const response = await api.get(`/attendance`, {
        params: {
          seasonId: selectedSeasonId,
          classId: selectedClassId,
          section: selectedSection,
          startDate: selectedDate.toISOString(),
          endDate: selectedDate.toISOString()
        }
      });
      return response.data;
    },
    enabled: !!selectedSeasonId && !!selectedClassId && !!selectedSection && !!schoolId,
  });

  const saveAttendanceMutation = useMutation({
    mutationFn: async (data: AttendanceRow[]) => {
      const attendanceRecords = data.map(record => ({
        studentId: record.studentId,
        status: record.status,
        absentReason: record.status === 'absent' ? record.absentReason : '',
        hygieneIssues: record.status !== 'absent' ? record.hygieneIssues : [],
        remarks: record.remarks,
      }));
      
      return api.post('/attendance/bulk', {
        seasonId: selectedSeasonId,
        classId: selectedClassId,
        section: selectedSection,
        date: selectedDate,
        attendance: attendanceRecords,
      });
    },
    onSuccess: () => {
      setIsSaving(false);
      setOriginalData(JSON.parse(JSON.stringify(attendanceData)));
      refetchAttendance();
      notifications.show({ title: 'Success', message: 'Attendance saved', color: 'green' });
    },
    onError: (err: any) => {
      console.error('Save error:', err.response?.data);
      setIsSaving(false);
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Failed to save', color: 'red' });
    },
  });

  const hasChanges = useCallback(() => {
    return JSON.stringify(attendanceData) !== JSON.stringify(originalData);
  }, [attendanceData, originalData]);

  useEffect(() => {
    if (hasChanges() && selectedSeasonId && selectedClassId && selectedSection && attendanceData.length > 0) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        if (hasChanges()) {
          setIsSaving(true);
          saveAttendanceMutation.mutate(attendanceData);
        }
      }, 1500);
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [attendanceData, selectedSeasonId, selectedClassId, selectedSection]);

  // Debounced remark save for individual student
  const handleRemarkChange = useCallback((studentId: string, value: string) => {
    // Update local state immediately
    updateField(studentId, 'remarks', value);
    
    // Clear existing timeout for this student
    if (remarksTimeoutsRef.current.has(studentId)) {
      clearTimeout(remarksTimeoutsRef.current.get(studentId));
    }
    
    // Set new timeout to save after 1.5 seconds
    const timeout = setTimeout(() => {
      if (hasChanges()) {
        setIsSaving(true);
        saveAttendanceMutation.mutate(attendanceData);
      }
    }, 1500);
    
    remarksTimeoutsRef.current.set(studentId, timeout);
  }, [attendanceData]);

  // Calculate top 5 most present students
  const topPresentStudents = useMemo(() => {
    if (!monthlyAttendance || !academicRecords) return [];
    
    const studentStats = new Map();
    
    academicRecords.forEach((record: any) => {
      const studentId = typeof record.studentId === 'string' ? record.studentId : record.studentId._id;
      studentStats.set(studentId, { present: 0, total: 0 });
    });
    
    monthlyAttendance.forEach((att: any) => {
      const studentId = typeof att.studentId === 'string' ? att.studentId : att.studentId._id;
      if (studentStats.has(studentId)) {
        const stats = studentStats.get(studentId);
        stats.total++;
        if (att.status === 'present') stats.present++;
        studentStats.set(studentId, stats);
      }
    });
    
    const statsArray = Array.from(studentStats.entries()).map(([studentId, stats]) => {
      const student = academicRecords.find((r: any) => {
        const sid = typeof r.studentId === 'string' ? r.studentId : r.studentId._id;
        return sid === studentId;
      });
      const studentName = student ? (typeof student.studentId === 'string' ? 'Loading...' : (student.studentId as any).name) : 'Unknown';
      const rollNumber = student?.rollNumber || 'N/A';
      const percentage = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;
      return { studentId, studentName, rollNumber, presentCount: stats.present, totalDays: stats.total, percentage };
    });
    
    return statsArray.sort((a, b) => b.percentage - a.percentage).slice(0, 5);
  }, [monthlyAttendance, academicRecords]);

  // Calculate top 5 most absent students
  const topAbsentStudents = useMemo(() => {
    if (!monthlyAttendance || !academicRecords) return [];
    
    const studentStats = new Map();
    
    academicRecords.forEach((record: any) => {
      const studentId = typeof record.studentId === 'string' ? record.studentId : record.studentId._id;
      studentStats.set(studentId, { absent: 0, total: 0 });
    });
    
    monthlyAttendance.forEach((att: any) => {
      const studentId = typeof att.studentId === 'string' ? att.studentId : att.studentId._id;
      if (studentStats.has(studentId)) {
        const stats = studentStats.get(studentId);
        stats.total++;
        if (att.status === 'absent') stats.absent++;
        studentStats.set(studentId, stats);
      }
    });
    
    const statsArray = Array.from(studentStats.entries()).map(([studentId, stats]) => {
      const student = academicRecords.find((r: any) => {
        const sid = typeof r.studentId === 'string' ? r.studentId : r.studentId._id;
        return sid === studentId;
      });
      const studentName = student ? (typeof student.studentId === 'string' ? 'Loading...' : (student.studentId as any).name) : 'Unknown';
      const rollNumber = student?.rollNumber || 'N/A';
      const percentage = stats.total > 0 ? (stats.absent / stats.total) * 100 : 0;
      return { studentId, studentName, rollNumber, absentCount: stats.absent, totalDays: stats.total, percentage };
    });
    
    return statsArray.sort((a, b) => b.percentage - a.percentage).slice(0, 5);
  }, [monthlyAttendance, academicRecords]);

  // Load data into table
  useEffect(() => {
    if (academicRecords && academicRecords.length > 0) {
      const records = academicRecords.map((record: any) => {
        const studentId = typeof record.studentId === 'string' ? record.studentId : record.studentId._id;
        const studentName = typeof record.studentId === 'string' ? 'Loading...' : (record.studentId as any).name;
        const existing = existingAttendance?.find((a: any) => {
          const aStudentId = typeof a.studentId === 'string' ? a.studentId : a.studentId._id;
          return aStudentId === studentId;
        });
        
        if (existing) {
          return {
            studentId,
            studentName,
            rollNumber: record.rollNumber,
            status: existing.status as 'present' | 'absent' | 'late' | 'half-day',
            absentReason: existing.absentReason || '',
            hygieneIssues: existing.hygieneIssues || [],
            remarks: existing.remarks || '',
          };
        } else {
          return {
            studentId,
            studentName,
            rollNumber: record.rollNumber,
            status: 'absent' as const,
            absentReason: '',
            hygieneIssues: [],
            remarks: '',
          };
        }
      });
      setAttendanceData(records);
      setOriginalData(JSON.parse(JSON.stringify(records)));
    }
  }, [academicRecords, existingAttendance]);

  const updateField = (studentId: string, field: string, value: any) => {
    setAttendanceData(prev => prev.map(student => 
      student.studentId === studentId ? { ...student, [field]: value } : student
    ));
  };

  const updateStatus = (studentId: string, status: 'present' | 'absent' | 'late' | 'half-day') => {
    setAttendanceData(prev => prev.map(student => 
      student.studentId === studentId ? { 
        ...student, 
        status, 
        absentReason: status === 'absent' ? student.absentReason : '',
      } : student
    ));
  };

  const handleMarkAllPresent = () => {
    setAttendanceData(prev => prev.map(student => ({
      ...student,
      status: 'present',
      absentReason: '',
    })));
    
    notifications.show({ 
      title: 'Marked All Present', 
      message: `${attendanceData.length} students marked as present.`,
      color: 'green' 
    });
  };

  const handleMarkAllAbsent = () => {
    setAttendanceData(prev => prev.map(student => ({
      ...student,
      status: 'absent',
      absentReason: '',
      hygieneIssues: [],
    })));
    
    notifications.show({ 
      title: 'Marked All Absent', 
      message: `${attendanceData.length} students marked as absent.`,
      color: 'red' 
    });
  };

  const handleRefresh = () => {
    refetchAttendance();
    refetchStudents();
  };

  // Get today's absent students
  const todaysAbsentStudents = attendanceData.filter(student => student.status === 'absent');
  
  const columnHelper = createColumnHelper<AttendanceRow>();
  const columns = useMemo(() => [
    columnHelper.accessor('rollNumber', { header: 'Roll No', size: 70 }),
    columnHelper.display({
      id: 'studentName',
      header: 'Student Name',
      size: 180,
      cell: ({ row }) => (
        <Button 
          variant="subtle" 
          size="xs" 
          onClick={() => fetchStudentDetails(row.original.studentId)}
          style={{ fontWeight: 500, padding: 0 }}
        >
          {row.original.studentName}
        </Button>
      ),
    }),
    columnHelper.display({
      id: 'status',
      header: 'Attendance',
      size: 200,
      cell: ({ row }) => (
        <Group gap="xs">
          <Button size="xs" variant={row.original.status === 'present' ? 'filled' : 'light'} color="green" onClick={() => updateStatus(row.original.studentId, 'present')}>✅ P</Button>
          <Button size="xs" variant={row.original.status === 'absent' ? 'filled' : 'light'} color="red" onClick={() => updateStatus(row.original.studentId, 'absent')}>❌ A</Button>
          <Button size="xs" variant={row.original.status === 'late' ? 'filled' : 'light'} color="yellow" onClick={() => updateStatus(row.original.studentId, 'late')}>⏰ L</Button>
          <Button size="xs" variant={row.original.status === 'half-day' ? 'filled' : 'light'} color="orange" onClick={() => updateStatus(row.original.studentId, 'half-day')}>🌓 H</Button>
        </Group>
      ),
    }),
    columnHelper.display({
      id: 'absentReason',
      header: 'Absent Reason',
      size: 160,
      cell: ({ row }) => {
        if (row.original.status !== 'absent') return <Text c="dimmed" size="sm">—</Text>;
        return (
          <Select placeholder="Select reason" data={ABSENT_REASONS} value={row.original.absentReason} onChange={(val) => updateField(row.original.studentId, 'absentReason', val || '')} size="xs" />
        );
      },
    }),
    columnHelper.display({
      id: 'hygiene',
      header: 'Hygiene',
      size: 140,
      cell: ({ row }) => {
        if (row.original.status === 'absent') return <Text c="dimmed" size="sm">—</Text>;
        return (
          <MultiSelect placeholder="Issues" data={HYGIENE_ISSUES.slice(0, 5)} value={row.original.hygieneIssues} onChange={(val) => updateField(row.original.studentId, 'hygieneIssues', val)} size="xs" clearable />
        );
      },
    }),
    columnHelper.display({
      id: 'remarks',
      header: 'Remarks',
      size: 250,
      cell: ({ row }) => (
        <Textarea 
          placeholder="Add remarks..." 
          value={row.original.remarks} 
          onChange={(e) => handleRemarkChange(row.original.studentId, e.currentTarget.value)} 
          size="xs" 
          autosize 
          minRows={1} 
          maxRows={2} 
          styles={{ input: { fontSize: '12px' } }}
        />
      ),
    }),
  ], [attendanceData]);

  const table = useReactTable({
    data: attendanceData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  if (!schoolId) {
    return <Loader />;
  }

  // Calculate summary stats
  const totalStudents = attendanceData.length;
  const presentCount = attendanceData.filter(s => s.status === 'present').length;
  const absentCount = attendanceData.filter(s => s.status === 'absent').length;
  const lateCount = attendanceData.filter(s => s.status === 'late').length;
  const halfDayCount = attendanceData.filter(s => s.status === 'half-day').length;

  return (
    <Stack p="md" gap="md">
      <Title order={1}>Daily Attendance</Title>
      
      {/* All dropdowns in one row */}
      <Grid>
        <Grid.Col span={2}>
          <Select 
            label="Academic Season" 
            placeholder="Select season" 
            data={seasons?.map(s => ({ value: s._id, label: s.name })) || []} 
            value={selectedSeasonId} 
            onChange={(val) => { setSelectedSeasonId(val || ''); setSelectedClassId(''); setSelectedSection(''); }} 
          />
        </Grid.Col>
        <Grid.Col span={2}>
          <Select 
            label="Class" 
            placeholder="Select class" 
            data={classes?.map(c => ({ value: c._id, label: c.displayName })) || []} 
            value={selectedClassId} 
            onChange={(val) => { setSelectedClassId(val || ''); setSelectedSection(''); }} 
            disabled={!selectedSeasonId} 
          />
        </Grid.Col>
        <Grid.Col span={2}>
          <Select 
            label="Section" 
            placeholder="Select section" 
            data={getSectionsForClass()} 
            value={selectedSection} 
            onChange={setSelectedSection} 
            disabled={!selectedClassId} 
          />
        </Grid.Col>
        <Grid.Col span={2}>
          <Select label="Year" data={yearOptions} value={selectedYear} onChange={(val) => setSelectedYear(val || currentYear.toString())} />
        </Grid.Col>
        <Grid.Col span={2}>
          <Select label="Month" data={monthOptions} value={selectedMonth} onChange={(val) => { setSelectedMonth(val || '1'); setSelectedDay('1'); }} />
        </Grid.Col>
        <Grid.Col span={2}>
          <Select label="Day" data={dayOptions} value={selectedDay} onChange={(val) => setSelectedDay(val || '1')} />
        </Grid.Col>
      </Grid>

      {/* Top Performers Section */}
      <Grid>
        <Grid.Col span={6}>
          <Card withBorder shadow="sm" p="md" style={{ backgroundColor: '#e8f5e9' }}>
            <Group mb="md">
              <IconTrophy size={24} color="gold" />
              <Title order={4}>🏆 Top 5 Most Present Students (This Month)</Title>
            </Group>
            <Divider mb="md" />
            {topPresentStudents.length > 0 ? (
              <Stack gap="xs">
                {topPresentStudents.map((student, idx) => (
                  <Paper key={student.studentId} p="xs" withBorder>
                    <Group justify="space-between">
                      <Group>
                        <Badge size="lg" color="yellow" variant="filled">{idx + 1}</Badge>
                        <div>
                          <Button variant="subtle" size="xs" onClick={() => fetchStudentDetails(student.studentId)} style={{ fontWeight: 500, padding: 0 }}>
                            {student.studentName}
                          </Button>
                          <Text size="xs" c="dimmed">Roll No: {student.rollNumber}</Text>
                        </div>
                      </Group>
                      <Badge color="green" size="lg">{student.percentage.toFixed(1)}%</Badge>
                    </Group>
                    <Text size="xs" c="dimmed" mt={4}>Present: {student.presentCount} / {student.totalDays} days</Text>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Text ta="center" c="dimmed">No attendance data available yet</Text>
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={6}>
          <Card withBorder shadow="sm" p="md" style={{ backgroundColor: '#ffebee' }}>
            <Group mb="md">
              <IconMoodSad size={24} color="red" />
              <Title order={4}>⚠️ Top 5 Most Absent Students (This Month)</Title>
            </Group>
            <Divider mb="md" />
            {topAbsentStudents.length > 0 ? (
              <Stack gap="xs">
                {topAbsentStudents.map((student, idx) => (
                  <Paper key={student.studentId} p="xs" withBorder>
                    <Group justify="space-between">
                      <Group>
                        <Badge size="lg" color="red" variant="filled">{idx + 1}</Badge>
                        <div>
                          <Button variant="subtle" size="xs" onClick={() => fetchStudentDetails(student.studentId)} style={{ fontWeight: 500, padding: 0 }}>
                            {student.studentName}
                          </Button>
                          <Text size="xs" c="dimmed">Roll No: {student.rollNumber}</Text>
                        </div>
                      </Group>
                      <Badge color="red" size="lg">{student.percentage.toFixed(1)}%</Badge>
                    </Group>
                    <Text size="xs" c="dimmed" mt={4}>Absent: {student.absentCount} / {student.totalDays} days</Text>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Text ta="center" c="dimmed">No attendance data available yet</Text>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      {/* Today's Absent Students Section */}
      {todaysAbsentStudents.length > 0 && (
        <Card withBorder shadow="sm" p="md" style={{ backgroundColor: '#fff5f5' }}>
          <Group mb="md">
            <IconUserX size={24} color="red" />
            <Title order={4}>Today's Absent Students ({todaysAbsentStudents.length})</Title>
          </Group>
          <Divider mb="md" />
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {todaysAbsentStudents.map(student => (
              <Paper key={student.studentId} p="xs" withBorder style={{ backgroundColor: 'white' }}>
                <Group justify="space-between">
                  <div>
                    <Button variant="subtle" size="xs" onClick={() => fetchStudentDetails(student.studentId)} style={{ fontWeight: 500, padding: 0 }}>
                      {student.studentName}
                    </Button>
                    <Text size="xs" c="dimmed">Roll No: {student.rollNumber}</Text>
                  </div>
                  <Badge color="red" variant="light">
                    {ABSENT_REASONS.find(r => r.value === student.absentReason)?.label || student.absentReason || 'No reason'}
                  </Badge>
                </Group>
              </Paper>
            ))}
          </SimpleGrid>
        </Card>
      )}

      {/* Summary Stats */}
      <SimpleGrid cols={{ base: 1, md: 5 }} spacing="md">
        <Card withBorder p="sm" style={{ backgroundColor: '#e3f2fd' }}>
          <Text ta="center" size="sm" c="dimmed">Total Students</Text>
          <Text ta="center" fw={700} size="xl">{totalStudents}</Text>
        </Card>
        <Card withBorder p="sm" style={{ backgroundColor: '#e8f5e9' }}>
          <Text ta="center" size="sm" c="dimmed">✅ Present</Text>
          <Text ta="center" fw={700} size="xl" c="green">{presentCount}</Text>
        </Card>
        <Card withBorder p="sm" style={{ backgroundColor: '#ffebee' }}>
          <Text ta="center" size="sm" c="dimmed">❌ Absent</Text>
          <Text ta="center" fw={700} size="xl" c="red">{absentCount}</Text>
        </Card>
        <Card withBorder p="sm" style={{ backgroundColor: '#fff8e1' }}>
          <Text ta="center" size="sm" c="dimmed">⏰ Late</Text>
          <Text ta="center" fw={700} size="xl" c="orange">{lateCount}</Text>
        </Card>
        <Card withBorder p="sm" style={{ backgroundColor: '#f3e5f5' }}>
          <Text ta="center" size="sm" c="dimmed">🌓 Half Day</Text>
          <Text ta="center" fw={700} size="xl" c="purple">{halfDayCount}</Text>
        </Card>
      </SimpleGrid>

      <Alert color="blue" variant="light">
        <Group>
          <Text>📅 Selected Date: {selectedDate.toLocaleDateString()} ({dayOfWeek})</Text>
          {isSaving && <Badge ml="md" color="yellow">Saving...</Badge>}
          {hasChanges() && !isSaving && <Badge ml="md" color="orange">Unsaved changes</Badge>}
        </Group>
      </Alert>

      <Group>
        <Button onClick={handleMarkAllPresent} variant="light" color="green">✅ Mark All Present ({totalStudents})</Button>
        <Button onClick={handleMarkAllAbsent} variant="light" color="red">❌ Mark All Absent ({totalStudents})</Button>
        <Tooltip label="Refresh data"><ActionIcon onClick={handleRefresh} variant="light" size="lg"><IconRefresh size={18} /></ActionIcon></Tooltip>
      </Group>

      {studentsLoading && <Loader />}
      
      {attendanceData.length === 0 && !studentsLoading && selectedSeasonId && selectedClassId && selectedSection && (
        <Alert color="yellow">No students found for the selected class and section in this season. Please check if students are enrolled.</Alert>
      )}
      
      {attendanceData.length > 0 && (
        <Paper withBorder style={{ overflowX: 'auto' }}>
          <DataTable table={table} />
        </Paper>
      )}

      {/* Student Details Drawer - Only Parent Details (No email/contact for student) */}
      <Drawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        title="Student Details"
        position="right"
        size="lg"
        padding="md"
      >
        {selectedStudent && (
          <Stack gap="md">
            {/* Personal Information - No phone/email */}
            <Card withBorder p="md">
              <Group mb="md">
                <Avatar size="lg" color="blue" radius="xl">
                  {selectedStudent.name?.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                  <Text fw={700} size="lg">{selectedStudent.name}</Text>
                  <Text size="sm" c="dimmed">Student ID: {selectedStudent.studentId}</Text>
                  <Text size="sm" c="dimmed">Roll No: {selectedStudent.rollNumber || 'N/A'}</Text>
                </div>
              </Group>
              <Divider mb="md" />
              <Grid>
                <Grid.Col span={12}>
                  <Group gap="xs">
                    <IconMapPin size={16} />
                    <Text size="sm">Address: {selectedStudent.permanentAddress || 'N/A'}</Text>
                  </Group>
                </Grid.Col>
              </Grid>
            </Card>

            {/* Health & Behaviour */}
            <Card withBorder p="md">
              <Title order={5} mb="md">Health & Behaviour</Title>
              <Divider mb="md" />
              <Grid>
                <Grid.Col span={6}>
                  <Group gap="xs">
                    <IconHeartbeat size={16} />
                    <Text size="sm">Health Issues: {selectedStudent.longTermHealth?.length > 0 ? selectedStudent.longTermHealth.join(', ') : 'None'}</Text>
                  </Group>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Group gap="xs">
                    <IconMoodX size={16} />
                    <Text size="sm">Behaviour: {selectedStudent.abnormalBehaviour?.length > 0 ? selectedStudent.abnormalBehaviour.join(', ') : 'Normal'}</Text>
                  </Group>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Group gap="xs">
                    <IconDeviceMobile size={16} />
                    <Text size="sm">Mobile Access: {selectedStudent.mobileAccess || 'N/A'}</Text>
                  </Group>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Group gap="xs">
                    <IconWifi size={16} />
                    <Text size="sm">Internet Access: {selectedStudent.internetAccess || 'N/A'}</Text>
                  </Group>
                </Grid.Col>
              </Grid>
            </Card>

            {/* Parents Information - Full details */}
            <Card withBorder p="md">
              <Title order={5} mb="md">Parents/Guardians ({selectedStudent.parents?.length || 0})</Title>
              <Divider mb="md" />
              {selectedStudent.parents && selectedStudent.parents.length > 0 ? (
                selectedStudent.parents.map((parent, idx) => (
                  <Paper key={idx} p="sm" withBorder mb="sm">
                    <Group justify="space-between">
                      <div style={{ flex: 1 }}>
                        <Text fw={500}>{parent.relation}: {parent.name}</Text>
                        <Group gap="xs" mt={4}>
                          <IconPhone size={14} />
                          <Text size="xs">📞 {parent.phone}</Text>
                        </Group>
                        {parent.email && (
                          <Group gap="xs" mt={2}>
                            <IconMail size={14} />
                            <Text size="xs">✉️ {parent.email}</Text>
                          </Group>
                        )}
                        {parent.occupation && (
                          <Group gap="xs" mt={2}>
                            <IconBriefcase size={14} />
                            <Text size="xs">💼 {parent.occupation} at {parent.workplace || 'N/A'}</Text>
                          </Group>
                        )}
                        {parent.education && (
                          <Text size="xs" c="dimmed" mt={2}>🎓 Education: {parent.education}</Text>
                        )}
                        {parent.monthlyIncome && (
                          <Text size="xs" c="dimmed">💰 Income: Rs. {parent.monthlyIncome.toLocaleString()} (Monthly)</Text>
                        )}
                      </div>
                      {parent.isPrimary && <Badge color="blue">Primary Contact</Badge>}
                    </Group>
                  </Paper>
                ))
              ) : (
                <Text c="dimmed">No parent information available</Text>
              )}
            </Card>
          </Stack>
        )}
      </Drawer>
    </Stack>
  );
}