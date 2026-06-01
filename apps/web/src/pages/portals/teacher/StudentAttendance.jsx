import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Select, Button, Group, Title, Stack, Loader, Alert, Badge, 
  Textarea, Paper, MultiSelect, Text, ActionIcon, Tooltip, Card, 
  Divider, SimpleGrid, Grid, Drawer, Avatar, Container, Pagination
} from '@mantine/core';
import { useReactTable, getCoreRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { 
  IconRefresh, IconUserX, IconUser, IconClock, IconCheck,
  IconPlus, IconTrash, IconEdit, IconEye, IconCalendar
} from '@tabler/icons-react';
import { api } from '../../../lib/api';
import { notifications } from '@mantine/notifications';
import { motion } from 'framer-motion';

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

const ATTENDANCE_STATUS = [
  { value: 'present', label: '✅ Present', color: 'green' },
  { value: 'absent', label: '❌ Absent', color: 'red' },
  { value: 'late', label: '⏰ Late', color: 'orange' },
  { value: 'half-day', label: '🌓 Half Day', color: 'purple' },
];

export function StudentAttendance() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const classIdParam = searchParams.get('classId');
  const sectionParam = searchParams.get('section');
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const schoolSlug = localStorage.getItem('schoolSlug');
  const schoolId = user.schoolId;
  
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(classIdParam || '');
  const [selectedSection, setSelectedSection] = useState(sectionParam || '');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [drawerOpened, setDrawerOpened] = useState(false);
  const saveTimeoutRef = useRef(null);

  // Fetch seasons
  const { data: seasons } = useQuery({
    queryKey: ['seasons', schoolId],
    queryFn: () => api.get('/academic-seasons', { headers: { 'X-School-Id': schoolId } }).then(res => res.data),
    enabled: !!schoolId,
  });

  // Fetch classes where this teacher is class teacher
  const { data: classTeacherSections } = useQuery({
    queryKey: ['teacherClassTeacherSections', user.teacherId],
    queryFn: async () => {
      const response = await api.get(`/sections`, { 
        params: { classTeacherId: user.teacherId },
        headers: { 'X-School-Id': schoolId }
      });
      return response.data;
    },
    enabled: !!user.teacherId && !!schoolId,
  });

  // Auto-select first active season
  useEffect(() => {
    if (seasons && seasons.length > 0 && !selectedSeasonId) {
      const activeSeason = seasons.find(s => s.isActive);
      setSelectedSeasonId(activeSeason?._id || seasons[0]._id);
    }
  }, [seasons]);

  // Fetch filtered students
  const { data: academicRecords, isLoading: studentsLoading, refetch: refetchStudents } = useQuery({
    queryKey: ['academicRecords', selectedSeasonId, selectedClassId, selectedSection, schoolId],
    queryFn: async () => {
      if (!selectedSeasonId || !selectedClassId || !selectedSection) return [];
      const response = await api.get(`/academic-records`, {
        params: { seasonId: selectedSeasonId, classId: selectedClassId, section: selectedSection },
        headers: { 'X-School-Id': schoolId }
      });
      return response.data;
    },
    enabled: !!selectedSeasonId && !!selectedClassId && !!selectedSection && !!schoolId,
  });

  // Get existing attendance for the selected date
  const { data: existingAttendance, refetch: refetchAttendance } = useQuery({
    queryKey: ['attendance', selectedSeasonId, selectedClassId, selectedSection, selectedDate.toISOString().split('T')[0], schoolId],
    queryFn: async () => {
      if (!selectedSeasonId || !selectedClassId || !selectedSection) return [];
      const response = await api.get(`/attendance`, {
        params: {
          seasonId: selectedSeasonId,
          classId: selectedClassId,
          section: selectedSection,
          startDate: selectedDate.toISOString().split('T')[0],
          endDate: selectedDate.toISOString().split('T')[0]
        },
        headers: { 'X-School-Id': schoolId }
      });
      return response.data;
    },
    enabled: !!selectedSeasonId && !!selectedClassId && !!selectedSection && !!schoolId,
  });

  const saveAttendanceMutation = useMutation({
    mutationFn: async (data) => {
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
        schoolId: schoolId,
        markedBy: user.teacherId,
      }, { headers: { 'X-School-Id': schoolId } });
    },
    onSuccess: () => {
      setIsSaving(false);
      setOriginalData(JSON.parse(JSON.stringify(attendanceData)));
      refetchAttendance();
      notifications.show({ title: 'Success', message: 'Attendance saved', color: 'green' });
    },
    onError: (err) => {
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
  }, [attendanceData]);

  // Load data into table
  useEffect(() => {
    if (academicRecords && academicRecords.length > 0) {
      const records = academicRecords.map((record) => {
        const studentId = typeof record.studentId === 'string' ? record.studentId : record.studentId?._id;
        const studentName = typeof record.studentId === 'string' ? 'Loading...' : record.studentId?.name;
        const existing = existingAttendance?.find((a) => {
          const aStudentId = typeof a.studentId === 'string' ? a.studentId : a.studentId?._id;
          return aStudentId === studentId;
        });
        
        if (existing) {
          return {
            studentId,
            studentName,
            rollNumber: record.rollNumber,
            status: existing.status,
            absentReason: existing.absentReason || '',
            hygieneIssues: existing.hygieneIssues || [],
            remarks: existing.remarks || '',
          };
        } else {
          return {
            studentId,
            studentName,
            rollNumber: record.rollNumber,
            status: 'absent',
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

  const updateField = (studentId, field, value) => {
    setAttendanceData(prev => prev.map(student => 
      student.studentId === studentId ? { ...student, [field]: value } : student
    ));
  };

  const updateStatus = (studentId, status) => {
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

  const handleDateChange = (daysOffset) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + daysOffset);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const handleSeasonChange = (val) => {
    setSelectedSeasonId(val);
    setSelectedClassId('');
    setSelectedSection('');
  };

  const handleClassTeacherSelection = (classId, sectionName) => {
    setSelectedClassId(classId);
    setSelectedSection(sectionName);
    if (!selectedSeasonId && seasons?.[0]) {
      setSelectedSeasonId(seasons[0]._id);
    }
  };

  const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const totalStudents = attendanceData.length;
  const presentCount = attendanceData.filter(s => s.status === 'present').length;
  const absentCount = attendanceData.filter(s => s.status === 'absent').length;
  const lateCount = attendanceData.filter(s => s.status === 'late').length;
  const halfDayCount = attendanceData.filter(s => s.status === 'half-day').length;
  const attendancePercentage = totalStudents > 0 ? ((presentCount + lateCount + halfDayCount) / totalStudents * 100).toFixed(1) : 0;

  const columns = useMemo(() => [
    { accessorKey: 'rollNumber', header: 'Roll No', size: 70 },
    {
      accessorKey: 'studentName',
      header: 'Student Name',
      cell: ({ row }) => (
        <Button variant="subtle" size="xs" onClick={() => setSelectedStudent(row.original)}>
          {row.original.studentName}
        </Button>
      ),
    },
    {
      id: 'status',
      header: 'Attendance',
      cell: ({ row }) => (
        <Group gap="xs">
          {ATTENDANCE_STATUS.map((status) => (
            <Button
              key={status.value}
              size="xs"
              variant={row.original.status === status.value ? 'filled' : 'light'}
              color={status.color}
              onClick={() => updateStatus(row.original.studentId, status.value)}
            >
              {status.label}
            </Button>
          ))}
        </Group>
      ),
    },
    {
      id: 'absentReason',
      header: 'Absent Reason',
      cell: ({ row }) => {
        if (row.original.status !== 'absent') return <Text c="dimmed" size="sm">—</Text>;
        return (
          <Select 
            placeholder="Select reason" 
            data={ABSENT_REASONS} 
            value={row.original.absentReason} 
            onChange={(val) => updateField(row.original.studentId, 'absentReason', val || '')} 
            size="xs" 
          />
        );
      },
    },
    {
      id: 'hygiene',
      header: 'Hygiene',
      cell: ({ row }) => {
        if (row.original.status === 'absent') return <Text c="dimmed" size="sm">—</Text>;
        return (
          <MultiSelect 
            placeholder="Issues" 
            data={HYGIENE_ISSUES} 
            value={row.original.hygieneIssues} 
            onChange={(val) => updateField(row.original.studentId, 'hygieneIssues', val)} 
            size="xs" 
            clearable 
          />
        );
      },
    },
    {
      id: 'remarks',
      header: 'Remarks',
      cell: ({ row }) => (
        <Textarea 
          placeholder="Add remarks..." 
          value={row.original.remarks} 
          onChange={(e) => updateField(row.original.studentId, 'remarks', e.currentTarget.value)} 
          size="xs" 
          autosize 
          minRows={1} 
          maxRows={2} 
        />
      ),
    },
  ], [attendanceData]);

  const table = useReactTable({
    data: attendanceData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  const renderClassTeacherCards = () => {
    if (!classTeacherSections || classTeacherSections.length === 0) {
      return (
        <Alert color="yellow" variant="light">
          You are not assigned as a class teacher for any section. Please contact the administrator.
        </Alert>
      );
    }

    return (
      <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
        {classTeacherSections.map((section) => (
          <motion.div
            key={section._id}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Card 
              withBorder 
              shadow="sm" 
              p="lg" 
              radius="md"
              style={{ 
                cursor: 'pointer',
                background: selectedClassId === section.classId?._id && selectedSection === section.name 
                  ? 'linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)' 
                  : 'white',
                border: selectedClassId === section.classId?._id && selectedSection === section.name 
                  ? '2px solid #1e5a7a' 
                  : undefined
              }}
              onClick={() => handleClassTeacherSelection(section.classId?._id, section.name)}
            >
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text size="lg" fw={700}>{section.classId?.displayName}</Text>
                  <Text size="sm" c="dimmed">Section {section.name}</Text>
                </div>
                <Avatar color="blue" radius="xl" size="md">
                  <IconUser size={16} />
                </Avatar>
              </Group>
              <Divider my="md" />
              <Group gap="xs">
                <Badge color="green" variant="light">Class Teacher</Badge>
                <Badge color="blue" variant="light">{section.classId?.periodCount} Periods</Badge>
              </Group>
            </Card>
          </motion.div>
        ))}
      </SimpleGrid>
    );
  };

  return (
    <Container size="xl" p="md">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <div>
            <Title order={1}>📝 Mark Attendance</Title>
            <Text c="dimmed">As class teacher, mark attendance for your class</Text>
          </div>
          <Button variant="light" onClick={() => navigate(`/${schoolSlug}/teacher/dashboard`)}>
            Back to Dashboard
          </Button>
        </Group>

        <Card withBorder shadow="sm" p="lg" radius="md">
          <Title order={3} mb="md">Your Class Teacher Sections</Title>
          {renderClassTeacherCards()}
        </Card>

        {selectedClassId && selectedSection && (
          <>
            <Grid>
              <Grid.Col span={3}>
                <Select 
                  label="Academic Season" 
                  data={seasons?.map(s => ({ value: s._id, label: s.name })) || []} 
                  value={selectedSeasonId} 
                  onChange={handleSeasonChange}
                  required
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <Select label="Class" value={selectedClassId} disabled />
              </Grid.Col>
              <Grid.Col span={3}>
                <Select label="Section" value={selectedSection} disabled />
              </Grid.Col>
              <Grid.Col span={3}>
                <Group align="flex-end" style={{ height: '100%' }}>
                  <Button variant="light" onClick={() => handleDateChange(-1)}>← Previous</Button>
                  <Button variant="light" onClick={goToToday}>Today</Button>
                  <Button variant="light" onClick={() => handleDateChange(1)}>Next →</Button>
                </Group>
              </Grid.Col>
            </Grid>

            <SimpleGrid cols={{ base: 1, md: 5 }} spacing="md">
              <Card withBorder p="sm" style={{ backgroundColor: '#e3f2fd' }}>
                <Text ta="center" size="sm" c="dimmed">Total</Text>
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
              <Group justify="space-between">
                <Group>
                  <IconCalendar size={18} />
                  <Text>📅 Date: {selectedDate.toLocaleDateString()} ({dayOfWeek})</Text>
                  <Badge size="lg" color="teal">Attendance: {attendancePercentage}%</Badge>
                </Group>
                <Group>
                  <Button onClick={handleMarkAllPresent} variant="light" color="green" size="xs">Mark All Present</Button>
                  <Button onClick={handleMarkAllAbsent} variant="light" color="red" size="xs">Mark All Absent</Button>
                  <Tooltip label="Refresh">
                    <ActionIcon onClick={handleRefresh} variant="light">
                      <IconRefresh size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </Alert>

            {studentsLoading ? (
              <Loader />
            ) : attendanceData.length === 0 ? (
              <Alert color="yellow">No students found for this class and section.</Alert>
            ) : (
              <Paper withBorder style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f8f9fa' }}>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th key={header.id} style={{ padding: '12px', textAlign: 'left' }}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} style={{ padding: '8px' }}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Group justify="center" mt="md">
                  <Pagination 
                    total={table.getPageCount()} 
                    value={table.getState().pagination.pageIndex + 1} 
                    onChange={(page) => table.setPageIndex(page - 1)} 
                  />
                </Group>
              </Paper>
            )}
          </>
        )}

        <Drawer 
          opened={drawerOpened} 
          onClose={() => setDrawerOpened(false)} 
          title="Student Details" 
          position="right" 
          size="md"
        >
          {selectedStudent && (
            <Stack gap="md">
              <Card withBorder p="md">
                <Group>
                  <Avatar size="lg" color="blue" radius="xl">
                    {selectedStudent.studentName?.charAt(0)}
                  </Avatar>
                  <div>
                    <Text fw={700} size="lg">{selectedStudent.studentName}</Text>
                    <Text size="sm" c="dimmed">Roll No: {selectedStudent.rollNumber}</Text>
                  </div>
                </Group>
              </Card>
              <Button variant="default" onClick={() => setDrawerOpened(false)}>Close</Button>
            </Stack>
          )}
        </Drawer>
      </Stack>
    </Container>
  );
}