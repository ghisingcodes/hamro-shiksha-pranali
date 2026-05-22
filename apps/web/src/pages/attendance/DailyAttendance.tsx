import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Select, Button, Group, Title, Stack, Loader, Alert, Badge, 
  Textarea, Paper, MultiSelect, Text, ActionIcon, Tooltip
} from '@mantine/core';
import { createColumnHelper, useReactTable, getCoreRowModel, getPaginationRowModel } from '@tanstack/react-table';
import { IconRefresh } from '@tabler/icons-react';
import { api } from '../../lib/api';
import { AcademicSeason, Class, ClassSection } from '../../lib/types';
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
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    enabled: true,
  });

  const { data: classes } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then(res => res.data),
    enabled: true,
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

  const { data: academicRecords, isLoading: studentsLoading, refetch: refetchStudents } = useQuery({
    queryKey: ['academicRecords', selectedSeasonId, selectedClassId, selectedSection],
    queryFn: () => api.get(`/academic-records?seasonId=${selectedSeasonId}&classId=${selectedClassId}&section=${selectedSection}`).then(res => res.data),
    enabled: !!selectedSeasonId && !!selectedClassId && !!selectedSection,
  });

  const { data: existingAttendance, refetch: refetchAttendance } = useQuery({
    queryKey: ['attendance', selectedSeasonId, selectedClassId, selectedSection, selectedYear, selectedMonth, selectedDay],
    queryFn: () => api.get(`/attendance?seasonId=${selectedSeasonId}&classId=${selectedClassId}&section=${selectedSection}&startDate=${selectedDate.toISOString()}&endDate=${selectedDate.toISOString()}`).then(res => res.data),
    enabled: !!selectedSeasonId && !!selectedClassId && !!selectedSection,
  });

  // Save mutation
  const saveAttendanceMutation = useMutation({
    mutationFn: async (data: AttendanceRow[]) => {
      const attendanceRecords = data.map(record => ({
        studentId: record.studentId,
        status: record.status,
        absentReason: record.status === 'absent' ? record.absentReason : '',
        hygieneIssues: record.status === 'present' || record.status === 'late' || record.status === 'half-day' ? record.hygieneIssues : [],
        remarks: record.remarks,
      }));
      
      const response = await api.post('/attendance/bulk', {
        seasonId: selectedSeasonId,
        classId: selectedClassId,
        section: selectedSection,
        date: selectedDate,
        attendance: attendanceRecords,
      });
      return response.data;
    },
    onSuccess: () => {
      setIsSaving(false);
      // Update original data after successful save
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

  // Check if data has changed
  const hasChanges = useCallback(() => {
    return JSON.stringify(attendanceData) !== JSON.stringify(originalData);
  }, [attendanceData, originalData]);

  // Auto-save when changes are detected
  useEffect(() => {
    if (hasChanges() && selectedSeasonId && selectedClassId && selectedSection && attendanceData.length > 0) {
      // Clear previous timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Set new timeout to save after 1.5 seconds of no changes
      saveTimeoutRef.current = setTimeout(() => {
        if (hasChanges()) {
          setIsSaving(true);
          saveAttendanceMutation.mutate(attendanceData);
        }
      }, 1500);
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [attendanceData, selectedSeasonId, selectedClassId, selectedSection]);

  // Load data into table
  useEffect(() => {
    if (academicRecords) {
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
  };

  const handleMarkAllAbsent = () => {
    setAttendanceData(prev => prev.map(student => ({
      ...student,
      status: 'absent',
      absentReason: '',
      hygieneIssues: [],
    })));
  };

  const handleRefresh = () => {
    refetchAttendance();
    refetchStudents();
  };

  const columnHelper = createColumnHelper<AttendanceRow>();
  const columns = useMemo(() => [
    columnHelper.accessor('rollNumber', { header: 'Roll No', size: 80 }),
    columnHelper.accessor('studentName', { header: 'Student Name', size: 200 }),
    columnHelper.display({
      id: 'status',
      header: 'Attendance',
      size: 200,
      cell: ({ row }) => (
        <Group gap="xs">
          <Button 
            size="xs" 
            variant={row.original.status === 'present' ? 'filled' : 'light'}
            color="green"
            onClick={() => updateStatus(row.original.studentId, 'present')}
          >
            ✅ P
          </Button>
          <Button 
            size="xs" 
            variant={row.original.status === 'absent' ? 'filled' : 'light'}
            color="red"
            onClick={() => updateStatus(row.original.studentId, 'absent')}
          >
            ❌ A
          </Button>
          <Button 
            size="xs" 
            variant={row.original.status === 'late' ? 'filled' : 'light'}
            color="yellow"
            onClick={() => updateStatus(row.original.studentId, 'late')}
          >
            ⏰ L
          </Button>
          <Button 
            size="xs" 
            variant={row.original.status === 'half-day' ? 'filled' : 'light'}
            color="orange"
            onClick={() => updateStatus(row.original.studentId, 'half-day')}
          >
            🌓 H
          </Button>
        </Group>
      ),
    }),
    columnHelper.display({
      id: 'absentReason',
      header: 'Absent Reason',
      size: 180,
      cell: ({ row }) => {
        if (row.original.status !== 'absent') return <Text c="dimmed" size="sm">—</Text>;
        return (
          <Select
            placeholder="Select reason"
            data={ABSENT_REASONS}
            value={row.original.absentReason}
            onChange={(val) => updateField(row.original.studentId, 'absentReason', val || '')}
            size="xs"
            styles={{ wrapper: { minWidth: 150 } }}
          />
        );
      },
    }),
    columnHelper.display({
      id: 'hygiene',
      header: 'Hygiene Issues',
      size: 200,
      cell: ({ row }) => {
        if (row.original.status === 'absent') return <Text c="dimmed" size="sm">—</Text>;
        return (
          <MultiSelect
            placeholder="Select issues"
            data={HYGIENE_ISSUES}
            value={row.original.hygieneIssues}
            onChange={(val) => updateField(row.original.studentId, 'hygieneIssues', val)}
            size="xs"
            styles={{ wrapper: { minWidth: 180 } }}
            clearable
          />
        );
      },
    }),
    columnHelper.display({
      id: 'remarks',
      header: 'Remarks',
      size: 200,
      cell: ({ row }) => (
        <Textarea
          placeholder="Remarks..."
          value={row.original.remarks}
          onChange={(e) => updateField(row.original.studentId, 'remarks', e.currentTarget.value)}
          size="xs"
          autosize
          minRows={1}
          maxRows={2}
          style={{ minWidth: 150 }}
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

  return (
    <Stack p="md">
      <Title order={1}>Daily Attendance</Title>
      
      <Group grow>
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
        <Select
          label="Year"
          data={yearOptions}
          value={selectedYear}
          onChange={(val) => setSelectedYear(val || currentYear.toString())}
        />
        <Select
          label="Month"
          data={monthOptions}
          value={selectedMonth}
          onChange={(val) => {
            setSelectedMonth(val || '1');
            setSelectedDay('1');
          }}
        />
        <Select
          label="Day"
          data={dayOptions}
          value={selectedDay}
          onChange={(val) => setSelectedDay(val || '1')}
        />
      </Group>

      <Alert color="blue" variant="light">
        📅 Selected Date: {selectedDate.toLocaleDateString()} ({dayOfWeek})
        {isSaving && <Badge ml="md" color="yellow">Saving...</Badge>}
        {hasChanges() && !isSaving && <Badge ml="md" color="orange">Unsaved changes</Badge>}
      </Alert>

      <Group>
        <Button onClick={handleMarkAllPresent} variant="light" color="green">✅ Mark All Present</Button>
        <Button onClick={handleMarkAllAbsent} variant="light" color="red">❌ Mark All Absent</Button>
        <Tooltip label="Refresh data">
          <ActionIcon onClick={handleRefresh} variant="light" size="lg">
            <IconRefresh size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {studentsLoading && <Loader />}
      
      {attendanceData.length > 0 && (
        <Paper withBorder style={{ overflowX: 'auto' }}>
          <DataTable table={table} />
        </Paper>
      )}
    </Stack>
  );
}