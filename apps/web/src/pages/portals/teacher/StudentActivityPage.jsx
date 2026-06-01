import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Select, Button, Group, Title, Stack, Loader, Alert, Badge,
  Textarea, Paper, MultiSelect, Text, Tabs,
  ActionIcon, Tooltip, Divider, TextInput, Checkbox, Drawer, Box, Card, Avatar
} from '@mantine/core';
import { IconRefresh, IconSettings, IconDeviceFloppy, IconSearch, IconCalendar, IconBook, IconUser, IconSchool } from '@tabler/icons-react';
import { createColumnHelper, useReactTable, getCoreRowModel, getPaginationRowModel, getFilteredRowModel } from '@tanstack/react-table';
import { api } from '../../../lib/api';
import { notifications } from '@mantine/notifications';
import { motion } from 'framer-motion';

// Status options with ratings (0-4 scale)
const HOMEWORK_OPTIONS = [
  { value: 'complete', label: '✅ Complete', rating: 4 },
  { value: 'partial', label: '🟡 Partial', rating: 2 },
  { value: 'incomplete', label: '🔴 Incomplete', rating: 1 },
  { value: 'not_submitted', label: '📤 Not Submitted', rating: 0 },
];

const CLASSWORK_OPTIONS = [
  { value: 'complete', label: '✅ Complete', rating: 4 },
  { value: 'partial', label: '🟡 Partial', rating: 2 },
  { value: 'incomplete', label: '🔴 Incomplete', rating: 1 },
  { value: 'not_submitted', label: '📤 Not Submitted', rating: 0 },
];

const HOMEWORK_ISSUES = ['Forgot at home', 'Not completed', 'No notebook', 'Was absent', 'Other'];
const CLASSWORK_ISSUES = ['Not done in class', 'Was absent', 'No understanding', 'Left early', 'Other'];

const DISCIPLINE_OPTIONS = [
  { value: 'good', label: '😊 Good', rating: 4 },
  { value: 'warning', label: '⚠️ Warning', rating: 2 },
  { value: 'bad', label: '🔴 Bad', rating: 0 },
];

const DISCIPLINE_ISSUES = ['Talking', 'Using phone', 'Disrespectful', 'Late arrival', 'Other'];

const HEALTH_OPTIONS = [
  { value: 'good', label: '😊 Good' },
  { value: 'minor', label: '🤒 Minor' },
  { value: 'moderate', label: '🏥 Moderate' },
  { value: 'serious', label: '⚠️ Serious' },
];

const HEALTH_PROBLEMS = ['Headache', 'Fever', 'Stomach ache', 'Dizziness', 'Injury', 'Other'];

const PRACTICAL_OPTIONS = [
  { value: 'complete', label: '✅ Complete', rating: 4 },
  { value: 'partial', label: '🟡 Partial', rating: 2 },
  { value: 'incomplete', label: '🔴 Incomplete', rating: 1 },
  { value: 'not_done', label: '❌ Not Done', rating: 0 },
];

const READING_OPTIONS = [
  { value: 'excellent', label: '🌟 Excellent', rating: 4 },
  { value: 'good', label: '😊 Good', rating: 3 },
  { value: 'average', label: '📊 Average', rating: 2 },
  { value: 'poor', label: '🔴 Poor', rating: 1 },
  { value: 'not_done', label: '❌ Not Done', rating: 0 },
];

const WRITING_OPTIONS = [
  { value: 'excellent', label: '🌟 Excellent', rating: 4 },
  { value: 'good', label: '😊 Good', rating: 3 },
  { value: 'average', label: '📊 Average', rating: 2 },
  { value: 'poor', label: '🔴 Poor', rating: 1 },
  { value: 'not_done', label: '❌ Not Done', rating: 0 },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_SHORT = { M: 'Mon', T: 'Tue', W: 'Wed', Th: 'Thu', F: 'Fri' };

const ALL_COLUMNS = [
  { id: 'rollNo', label: 'Roll No', width: 80 },
  { id: 'studentName', label: 'Student Name', width: 200 },
  { id: 'homeworkStatus', label: '📖 Homework (0-4)', width: 220 },
  { id: 'homeworkIssue', label: 'Homework Issue', width: 180 },
  { id: 'classworkStatus', label: '📝 Classwork (0-4)', width: 220 },
  { id: 'classworkIssue', label: 'Classwork Issue', width: 180 },
  { id: 'disciplineStatus', label: '⚖️ Discipline (0-4)', width: 200 },
  { id: 'disciplineIssue', label: 'Discipline Issue', width: 180 },
  { id: 'healthStatus', label: '🩺 Health', width: 200 },
  { id: 'healthProblems', label: 'Health Problems', width: 200 },
  { id: 'practicalStatus', label: '🔬 Practical (0-4)', width: 180 },
  { id: 'readingStatus', label: '📖 Reading (0-4)', width: 180 },
  { id: 'writingStatus', label: '✍️ Writing (0-4)', width: 180 },
  { id: 'remarks', label: 'Remarks', width: 200 },
];

const DEFAULT_VISIBLE_COLUMNS = ['rollNo', 'studentName', 'homeworkStatus', 'classworkStatus', 'disciplineStatus', 'remarks'];

const getRating = (status, options) => {
  const option = options.find(opt => opt.value === status);
  return option?.rating ?? 0;
};

const calculateAverage = (row) => {
  const ratings = [];
  if (row.homeworkStatus !== 'not_submitted') ratings.push(row.homeworkRating);
  if (row.classworkStatus !== 'not_submitted') ratings.push(row.classworkRating);
  if (row.disciplineStatus !== 'good') ratings.push(row.disciplineRating);
  if (row.practicalStatus !== 'not_done') ratings.push(row.practicalRating);
  if (row.readingStatus !== 'not_done') ratings.push(row.readingRating);
  if (row.writingStatus !== 'not_done') ratings.push(row.writingRating);
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((a, b) => a + b, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
};

export function StudentActivityPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const schoolSlug = localStorage.getItem('schoolSlug');
  const schoolId = user.schoolId;
  
  const classIdParam = searchParams.get('classId');
  const sectionParam = searchParams.get('section');
  const periodParam = searchParams.get('period');
  
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(classIdParam || '');
  const [selectedSection, setSelectedSection] = useState(sectionParam || '');
  const [activePeriod, setActivePeriod] = useState<number>(periodParam ? parseInt(periodParam) : 1);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activityData, setActivityData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [teacherAssignments, setTeacherAssignments] = useState([]);

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);

  // Fetch teacher's assigned sections
  const { data: assignedSections, isLoading: scheduleLoading } = useQuery({
    queryKey: ['teacherAssignedSections', user.teacherId, schoolId],
    queryFn: async () => {
      const response = await api.get(`/sections`, { 
        params: { teacherId: user.teacherId },
        headers: { 'X-School-Id': schoolId }
      });
      return response.data;
    },
    enabled: !!user.teacherId && !!schoolId,
  });

  // Build teacher's schedule
  useEffect(() => {
    if (assignedSections && assignedSections.length > 0) {
      const assignments = [];
      assignedSections.forEach((section) => {
        const periodTeachers = section.periodTeachers || {};
        Object.entries(periodTeachers).forEach(([period, periodAssignments]) => {
          const active = periodAssignments?.find((a) => !a.endDate && a.teacherId === user.teacherId);
          if (active) {
            assignments.push({
              period: parseInt(period),
              classId: section.classId?._id,
              className: section.classId?.displayName,
              sectionName: section.name,
              subjectId: active.subjectId?._id,
              subjectName: active.subjectId?.name,
              days: active.days,
            });
          }
        });
      });
      setTeacherAssignments(assignments);
      
      if (!selectedClassId && assignments.length > 0) {
        setSelectedClassId(assignments[0].classId);
        setSelectedSection(assignments[0].sectionName);
        setActivePeriod(assignments[0].period);
      }
    }
  }, [assignedSections, user.teacherId]);

  // Fetch seasons
  const { data: seasons } = useQuery({
    queryKey: ['seasons', schoolId],
    queryFn: () => api.get('/academic-seasons', { headers: { 'X-School-Id': schoolId } }).then(res => res.data),
    enabled: !!schoolId,
  });

  useEffect(() => {
    if (seasons && seasons.length > 0 && !selectedSeasonId) {
      const activeSeason = seasons.find(s => s.isActive);
      setSelectedSeasonId(activeSeason?._id || seasons[0]._id);
    }
  }, [seasons]);

  // Fetch academic records
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

  // Fetch existing activities
  const { data: existingActivities, refetch: refetchActivities } = useQuery({
    queryKey: ['studentActivities', selectedSeasonId, selectedClassId, selectedSection, activePeriod, selectedDate.toISOString().split('T')[0], schoolId],
    queryFn: async () => {
      if (!selectedSeasonId || !selectedClassId || !selectedSection || !activePeriod) return [];
      const response = await api.get(`/student-activities`, {
        params: {
          seasonId: selectedSeasonId,
          classId: selectedClassId,
          section: selectedSection,
          period: activePeriod,
          date: selectedDate.toISOString().split('T')[0]
        },
        headers: { 'X-School-Id': schoolId }
      });
      return response.data;
    },
    enabled: !!selectedSeasonId && !!selectedClassId && !!selectedSection && !!activePeriod && !!schoolId,
  });

  // Load data into table
  useEffect(() => {
    if (academicRecords && academicRecords.length > 0 && activePeriod) {
      const records = academicRecords.map((record) => {
        const studentId = typeof record.studentId === 'string' ? record.studentId : record.studentId?._id;
        const studentName = typeof record.studentId === 'string' ? 'Loading...' : record.studentId?.name;
        const existing = existingActivities?.find((a) => {
          const aStudentId = typeof a.studentId === 'string' ? a.studentId : a.studentId?._id;
          return aStudentId === studentId;
        });
        
        const homeworkStatus = existing?.homeworkStatus || 'not_submitted';
        const classworkStatus = existing?.classworkStatus || 'not_submitted';
        const disciplineStatus = existing?.disciplineStatus || 'good';
        const practicalStatus = existing?.practicalStatus || 'not_done';
        const readingStatus = existing?.readingStatus || 'not_done';
        const writingStatus = existing?.writingStatus || 'not_done';
        
        const row = {
          studentId,
          studentName,
          rollNumber: record.rollNumber,
          homeworkStatus,
          homeworkIssue: existing?.homeworkIssue || '',
          homeworkRating: getRating(homeworkStatus, HOMEWORK_OPTIONS),
          classworkStatus,
          classworkIssue: existing?.classworkIssue || '',
          classworkRating: getRating(classworkStatus, CLASSWORK_OPTIONS),
          disciplineStatus,
          disciplineIssue: existing?.disciplineIssue || '',
          disciplineRating: getRating(disciplineStatus, DISCIPLINE_OPTIONS),
          healthStatus: existing?.healthStatus || 'good',
          healthProblems: existing?.healthProblems || [],
          practicalStatus,
          practicalRating: getRating(practicalStatus, PRACTICAL_OPTIONS),
          readingStatus,
          readingRating: getRating(readingStatus, READING_OPTIONS),
          writingStatus,
          writingRating: getRating(writingStatus, WRITING_OPTIONS),
          remarks: existing?.remarks || '',
        };
        row.averageMarks = calculateAverage(row);
        return row;
      });
      setActivityData(records);
      setOriginalData(JSON.parse(JSON.stringify(records)));
    }
  }, [academicRecords, existingActivities, activePeriod]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const activities = data.map(record => ({
        studentId: record.studentId,
        period: activePeriod,
        homeworkStatus: record.homeworkStatus,
        homeworkIssue: record.homeworkIssue,
        classworkStatus: record.classworkStatus,
        classworkIssue: record.classworkIssue,
        disciplineStatus: record.disciplineStatus,
        disciplineIssue: record.disciplineIssue,
        healthStatus: record.healthStatus,
        healthProblems: record.healthProblems,
        practicalStatus: record.practicalStatus,
        readingStatus: record.readingStatus,
        writingStatus: record.writingStatus,
        remarks: record.remarks,
      }));
      
      return api.post('/student-activities/bulk', {
        seasonId: selectedSeasonId,
        classId: selectedClassId,
        section: selectedSection,
        period: activePeriod,
        date: selectedDate,
        activities,
        schoolId: schoolId,
        markedBy: user.teacherId,
      }, { headers: { 'X-School-Id': schoolId } });
    },
    onSuccess: () => {
      setIsSaving(false);
      setOriginalData(JSON.parse(JSON.stringify(activityData)));
      refetchActivities();
      notifications.show({ title: 'Success', message: `Activities saved for Period ${activePeriod}`, color: 'green' });
    },
    onError: (err) => {
      setIsSaving(false);
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Failed to save', color: 'red' });
    },
  });

  const hasChanges = () => activityData.some((record, index) => JSON.stringify(originalData[index]) !== JSON.stringify(record));

  const handleSave = () => {
    if (activityData.length === 0) return;
    setIsSaving(true);
    saveMutation.mutate(activityData);
  };

  const updateField = useCallback((studentId, field, value) => {
    setActivityData(prev => prev.map(student => {
      if (student.studentId !== studentId) return student;
      const updated = { ...student, [field]: value };
      if (field === 'homeworkStatus') updated.homeworkRating = getRating(value, HOMEWORK_OPTIONS);
      if (field === 'classworkStatus') updated.classworkRating = getRating(value, CLASSWORK_OPTIONS);
      if (field === 'disciplineStatus') updated.disciplineRating = getRating(value, DISCIPLINE_OPTIONS);
      if (field === 'practicalStatus') updated.practicalRating = getRating(value, PRACTICAL_OPTIONS);
      if (field === 'readingStatus') updated.readingRating = getRating(value, READING_OPTIONS);
      if (field === 'writingStatus') updated.writingRating = getRating(value, WRITING_OPTIONS);
      updated.averageMarks = calculateAverage(updated);
      return updated;
    }));
  }, []);

  const updateRemarks = useCallback((studentId, value) => {
    setActivityData(prev => prev.map(student => 
      student.studentId === studentId ? { ...student, remarks: value } : student
    ));
  }, []);

  const handleRefresh = () => {
    refetchActivities();
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

  const toggleColumn = (columnId) => {
    setVisibleColumns(prev => 
      prev.includes(columnId) ? prev.filter(c => c !== columnId) : [...prev, columnId]
    );
  };

  const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const currentAssignment = teacherAssignments.find(a => a.period === activePeriod && a.classId === selectedClassId);

  const columnHelper = createColumnHelper();
  const columns = useMemo(() => {
    const cols = [];
    if (visibleColumns.includes('rollNo')) {
      cols.push(columnHelper.accessor('rollNumber', { header: 'Roll No', size: 80 }));
    }
    if (visibleColumns.includes('studentName')) {
      cols.push(columnHelper.accessor('studentName', { header: 'Student Name', size: 200 }));
    }
    if (visibleColumns.includes('homeworkStatus')) {
      cols.push(columnHelper.display({
        id: 'homeworkStatus',
        header: '📖 Homework (0-4)',
        size: 220,
        cell: ({ row }) => (
          <Stack gap={4}>
            <Select value={row.original.homeworkStatus} onChange={(val) => updateField(row.original.studentId, 'homeworkStatus', val)} data={HOMEWORK_OPTIONS} size="xs" />
            {row.original.homeworkStatus !== 'complete' && (
              <Select value={row.original.homeworkIssue} onChange={(val) => updateField(row.original.studentId, 'homeworkIssue', val)} data={HOMEWORK_ISSUES} size="xs" placeholder="Issue" clearable />
            )}
          </Stack>
        ),
      }));
    }
    if (visibleColumns.includes('classworkStatus')) {
      cols.push(columnHelper.display({
        id: 'classworkStatus',
        header: '📝 Classwork (0-4)',
        size: 220,
        cell: ({ row }) => (
          <Stack gap={4}>
            <Select value={row.original.classworkStatus} onChange={(val) => updateField(row.original.studentId, 'classworkStatus', val)} data={CLASSWORK_OPTIONS} size="xs" />
            {row.original.classworkStatus !== 'complete' && (
              <Select value={row.original.classworkIssue} onChange={(val) => updateField(row.original.studentId, 'classworkIssue', val)} data={CLASSWORK_ISSUES} size="xs" placeholder="Issue" clearable />
            )}
          </Stack>
        ),
      }));
    }
    if (visibleColumns.includes('disciplineStatus')) {
      cols.push(columnHelper.display({
        id: 'disciplineStatus',
        header: '⚖️ Discipline (0-4)',
        size: 200,
        cell: ({ row }) => (
          <Stack gap={4}>
            <Select value={row.original.disciplineStatus} onChange={(val) => updateField(row.original.studentId, 'disciplineStatus', val)} data={DISCIPLINE_OPTIONS} size="xs" />
            {row.original.disciplineStatus !== 'good' && (
              <Select value={row.original.disciplineIssue} onChange={(val) => updateField(row.original.studentId, 'disciplineIssue', val)} data={DISCIPLINE_ISSUES} size="xs" placeholder="Issue" clearable />
            )}
          </Stack>
        ),
      }));
    }
    if (visibleColumns.includes('healthStatus')) {
      cols.push(columnHelper.display({
        id: 'healthStatus',
        header: '🩺 Health',
        size: 200,
        cell: ({ row }) => (
          <Stack gap={4}>
            <Select value={row.original.healthStatus} onChange={(val) => updateField(row.original.studentId, 'healthStatus', val)} data={HEALTH_OPTIONS} size="xs" />
            {row.original.healthStatus !== 'good' && (
              <MultiSelect value={row.original.healthProblems} onChange={(val) => updateField(row.original.studentId, 'healthProblems', val)} data={HEALTH_PROBLEMS} size="xs" placeholder="Problems" clearable />
            )}
          </Stack>
        ),
      }));
    }
    if (visibleColumns.includes('remarks')) {
      cols.push(columnHelper.display({
        id: 'remarks',
        header: 'Remarks',
        size: 200,
        cell: ({ row }) => (
          <Textarea value={row.original.remarks} onChange={(e) => updateRemarks(row.original.studentId, e.currentTarget.value)} size="xs" placeholder="Remarks..." autosize minRows={1} maxRows={2} />
        ),
      }));
    }
    return cols;
  }, [visibleColumns, activityData, updateField, updateRemarks]);

  const table = useReactTable({
    data: activityData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 50 } },
  });

  const filteredData = useMemo(() => {
    if (!globalFilter) return activityData;
    const searchTerm = globalFilter.toLowerCase();
    return activityData.filter(student => 
      student.studentName?.toLowerCase().includes(searchTerm) ||
      student.rollNumber?.toLowerCase().includes(searchTerm)
    );
  }, [activityData, globalFilter]);

  if (scheduleLoading) return <Loader />;

  const todaySchedule = teacherAssignments.filter(a => a.days.includes(currentDay)).sort((a, b) => a.period - b.period);

  return (
    <Stack p="md" gap="lg">
      <Title order={1}>📋 Record Student Activities</Title>
      
      {/* Teacher's Schedule Cards */}
      <Card withBorder shadow="sm" p="md" radius="md">
        <Group mb="md">
          <IconBook size={20} />
          <Title order={3}>Your Today's Schedule - {new Date().toLocaleDateString('en-US', { weekday: 'long' })}</Title>
        </Group>
        
        {todaySchedule.length === 0 ? (
          <Alert color="yellow">No classes scheduled for today.</Alert>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
            {todaySchedule.map((schedule, idx) => (
              <motion.div key={idx} whileHover={{ scale: 1.02 }}>
                <Card
                  withBorder p="sm" radius="md"
                  style={{
                    cursor: 'pointer',
                    background: selectedClassId === schedule.classId && selectedSection === schedule.sectionName && activePeriod === schedule.period
                      ? 'linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)'
                      : 'white',
                    border: selectedClassId === schedule.classId && selectedSection === schedule.sectionName && activePeriod === schedule.period
                      ? '2px solid #1e5a7a' : undefined
                  }}
                  onClick={() => {
                    setSelectedClassId(schedule.classId);
                    setSelectedSection(schedule.sectionName);
                    setActivePeriod(schedule.period);
                  }}
                >
                  <Group justify="space-between">
                    <Badge size="lg" color="blue">Period {schedule.period}</Badge>
                    <Badge color="teal" variant="light">{schedule.days.map(d => DAY_SHORT[d]).join(', ')}</Badge>
                  </Group>
                  <Divider my="sm" />
                  <Group>
                    <Avatar color="cyan" radius="md"><IconSchool size={16} /></Avatar>
                    <div>
                      <Text fw={600}>{schedule.className}</Text>
                      <Text size="sm" c="dimmed">Section {schedule.sectionName}</Text>
                      <Text size="xs" c="dimmed">{schedule.subjectName}</Text>
                    </div>
                  </Group>
                </Card>
              </motion.div>
            ))}
          </SimpleGrid>
        )}
      </Card>

      {/* Activity Recording Section */}
      {selectedClassId && selectedSection && (
        <>
          <Card withBorder shadow="sm" p="md" radius="md" style={{ background: '#f0f9ff' }}>
            <Group justify="space-between">
              <Group>
                <Avatar size="lg" color="blue" radius="xl"><IconUser size={24} /></Avatar>
                <div>
                  <Text size="sm" c="dimmed">Recording Activities For</Text>
                  <Title order={2}>{selectedClassId} - Section {selectedSection}</Title>
                  <Group gap="xs" mt={4}>
                    <Badge size="lg" color="blue">Period {activePeriod}</Badge>
                    <Badge size="lg" color="teal">{currentAssignment?.subjectName || 'Subject'}</Badge>
                  </Group>
                </div>
              </Group>
              <Button variant="light" onClick={() => { setSelectedClassId(''); setSelectedSection(''); }}>Change Class</Button>
            </Group>
          </Card>

          <Group justify="space-between">
            <Group>
              <Button variant="light" onClick={() => handleDateChange(-1)}>← Previous</Button>
              <Button variant="light" onClick={goToToday}>Today</Button>
              <Button variant="light" onClick={() => handleDateChange(1)}>Next →</Button>
            </Group>
            <Group>
              <IconCalendar size={18} />
              <Text>{selectedDate.toLocaleDateString()} ({dayOfWeek})</Text>
              {hasChanges() && <Badge color="orange">Unsaved</Badge>}
              {isSaving && <Badge color="yellow">Saving...</Badge>}
            </Group>
          </Group>

          <Group justify="space-between">
            <Group>
              <TextInput placeholder="Search..." leftSection={<IconSearch size={16} />} value={globalFilter} onChange={(e) => setGlobalFilter(e.currentTarget.value)} size="sm" style={{ width: 250 }} />
              <Tooltip label="Refresh"><ActionIcon onClick={handleRefresh} variant="light"><IconRefresh size={18} /></ActionIcon></Tooltip>
            </Group>
            <Group>
              <Button variant="light" leftSection={<IconSettings size={16} />} onClick={() => setDrawerOpened(true)}>Columns</Button>
              <Button color="green" leftSection={<IconDeviceFloppy size={16} />} onClick={handleSave} loading={isSaving} disabled={!hasChanges()}>Save</Button>
            </Group>
          </Group>

          {studentsLoading ? <Loader /> : activityData.length === 0 ? (
            <Alert color="yellow">No students found for this class and section.</Alert>
          ) : (
            <Paper withBorder style={{ overflowX: 'auto' }}>
              <Box style={{ minWidth: visibleColumns.length * 150 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f8f9fa' }}>
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => <th key={header.id} style={{ padding: '12px' }}>{flexRender(header.column.columnDef.header, header.getContext())}</th>)}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => <td key={cell.id} style={{ padding: '8px' }}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Paper>
          )}
        </>
      )}

      <Drawer opened={drawerOpened} onClose={() => setDrawerOpened(false)} title="Select Columns" position="right" size="md">
        <Stack>
          {ALL_COLUMNS.map(col => <Checkbox key={col.id} label={col.label} checked={visibleColumns.includes(col.id)} onChange={() => toggleColumn(col.id)} />)}
          <Divider />
          <Group><Button onClick={() => setVisibleColumns(ALL_COLUMNS.map(c => c.id))}>Select All</Button><Button variant="light" onClick={() => setVisibleColumns(DEFAULT_VISIBLE_COLUMNS)}>Reset</Button></Group>
        </Stack>
      </Drawer>
    </Stack>
  );
}