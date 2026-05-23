import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Select, Button, Group, Title, Stack, Loader, Alert, Badge,
  Textarea, Paper, MultiSelect, Text, Tabs,
  ActionIcon, Tooltip, Divider, TextInput, Checkbox, Drawer, Box
} from '@mantine/core';
import { IconRefresh, IconSettings, IconDeviceFloppy, IconSearch } from '@tabler/icons-react';
import { createColumnHelper, useReactTable, getCoreRowModel, getPaginationRowModel, getFilteredRowModel } from '@tanstack/react-table';
import { api } from '../../lib/api';
import { AcademicSeason, Class, ClassSection } from '../../lib/types';
import { notifications } from '@mantine/notifications';
import { DataTable } from '../../components/DataTable';

// Status options with ratings (0-4 scale)
const HOMEWORK_OPTIONS = [
  { value: 'complete', label: '✅ Complete', rating: 4, description: 'All homework done correctly' },
  { value: 'partial', label: '🟡 Partial', rating: 2, description: 'Some homework missing' },
  { value: 'incomplete', label: '🔴 Incomplete', rating: 1, description: 'Most homework missing' },
  { value: 'not_submitted', label: '📤 Not Submitted', rating: 0, description: 'No homework submitted' },
];

const CLASSWORK_OPTIONS = [
  { value: 'complete', label: '✅ Complete', rating: 4, description: 'All classwork done correctly' },
  { value: 'partial', label: '🟡 Partial', rating: 2, description: 'Some classwork missing' },
  { value: 'incomplete', label: '🔴 Incomplete', rating: 1, description: 'Most classwork missing' },
  { value: 'not_submitted', label: '📤 Not Submitted', rating: 0, description: 'No classwork submitted' },
];

// Common issue reasons (10 each)
const HOMEWORK_ISSUES = [
  'Forgot at home', 'Not completed', 'No notebook', 'No pen/pencil',
  'Was absent', 'Did not understand', 'No time', 'Lost the book',
  'Parents not at home', 'Other'
];

const CLASSWORK_ISSUES = [
  'Not done in class', 'Was absent', 'No understanding', 'No materials',
  'Distracted', 'Left early', 'No submission', 'Incomplete work',
  'Quality poor', 'Other'
];

const DISCIPLINE_OPTIONS = [
  { value: 'good', label: '😊 Good', rating: 4, description: 'Good behavior' },
  { value: 'warning', label: '⚠️ Warning', rating: 2, description: 'Minor issues' },
  { value: 'bad', label: '🔴 Bad', rating: 0, description: 'Serious misconduct' },
];

const DISCIPLINE_ISSUES = [
  'Talking during class', 'Using phone', 'Not following instructions',
  'Disrespectful behavior', 'Sleeping in class', 'Late arrival',
  'Missing uniform', 'Cheating', 'Bullying', 'Fighting', 'Other'
];

const HEALTH_OPTIONS = [
  { value: 'good', label: '😊 Good' },
  { value: 'minor', label: '🤒 Minor' },
  { value: 'moderate', label: '🏥 Moderate' },
  { value: 'serious', label: '⚠️ Serious' },
];

const HEALTH_PROBLEMS = [
  'Headache', 'Fever', 'Stomach ache', 'Nausea', 'Dizziness',
  'Injury', 'Allergy', 'Asthma', 'Diabetes', 'Other'
];

const PRACTICAL_OPTIONS = [
  { value: 'complete', label: '✅ Complete', rating: 4, description: 'Practical work done' },
  { value: 'partial', label: '🟡 Partial', rating: 2, description: 'Partially done' },
  { value: 'incomplete', label: '🔴 Incomplete', rating: 1, description: 'Mostly incomplete' },
  { value: 'not_done', label: '❌ Not Done', rating: 0, description: 'No practical work' },
];

const READING_OPTIONS = [
  { value: 'excellent', label: '🌟 Excellent', rating: 4, description: 'Fluent reading' },
  { value: 'good', label: '😊 Good', rating: 3, description: 'Good reading skills' },
  { value: 'average', label: '📊 Average', rating: 2, description: 'Needs practice' },
  { value: 'poor', label: '🔴 Poor', rating: 1, description: 'Struggling' },
  { value: 'not_done', label: '❌ Not Done', rating: 0, description: 'No reading' },
];

const WRITING_OPTIONS = [
  { value: 'excellent', label: '🌟 Excellent', rating: 4, description: 'Excellent writing' },
  { value: 'good', label: '😊 Good', rating: 3, description: 'Good writing skills' },
  { value: 'average', label: '📊 Average', rating: 2, description: 'Needs improvement' },
  { value: 'poor', label: '🔴 Poor', rating: 1, description: 'Poor writing' },
  { value: 'not_done', label: '❌ Not Done', rating: 0, description: 'No writing' },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
  { id: 'averageMarks', label: '⭐ Average (0-4)', width: 120 },
  { id: 'remarks', label: 'Remarks', width: 200 },
];

const DEFAULT_VISIBLE_COLUMNS = [
  'rollNo', 'studentName', 'homeworkStatus', 'classworkStatus',
  'disciplineStatus', 'healthStatus', 'averageMarks', 'remarks'
];

interface AcademicRecordPopulated {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    studentId: string;
  };
  classId: {
    _id: string;
    displayName: string;
    periodCount: number;
  };
  seasonId: {
    _id: string;
    name: string;
  };
  section: string;
  rollNumber: string;
}

interface ActivityRow {
  studentId: string;
  studentName: string;
  rollNumber: string;
  homeworkStatus: string;
  homeworkIssue: string;
  homeworkRating: number;
  classworkStatus: string;
  classworkIssue: string;
  classworkRating: number;
  disciplineStatus: string;
  disciplineIssue: string;
  disciplineRating: number;
  healthStatus: string;
  healthProblems: string[];
  practicalStatus: string;
  practicalRating: number;
  readingStatus: string;
  readingRating: number;
  writingStatus: string;
  writingRating: number;
  averageMarks: number;
  remarks: string;
}

const getRating = (status: string, options: any[]) => {
  const option = options.find(opt => opt.value === status);
  return option?.rating ?? 0;
};

// Check if a field should be included in average calculation
const shouldIncludeInAverage = (row: ActivityRow, field: string) => {
  if (field === 'homework') {
    // Include if status is not 'not_submitted' OR has an issue
    return row.homeworkStatus !== 'not_submitted' || (row.homeworkIssue && row.homeworkIssue.trim() !== '');
  }
  if (field === 'classwork') {
    return row.classworkStatus !== 'not_submitted' || (row.classworkIssue && row.classworkIssue.trim() !== '');
  }
  if (field === 'practical') {
    return row.practicalStatus !== 'not_done' || (row.practicalIssue && row.practicalIssue.trim() !== '');
  }
  if (field === 'reading') {
    return row.readingStatus !== 'not_done';
  }
  if (field === 'writing') {
    return row.writingStatus !== 'not_done';
  }
  if (field === 'discipline') {
    return row.disciplineStatus !== 'good';
  }
  return false;
};

// Calculate average based on fields that have meaningful values OR issues
const calculateAverage = (row: ActivityRow) => {
  const ratings: any = {};
  
  if (shouldIncludeInAverage(row, 'homework')) {
    ratings.homework = row.homeworkRating;
  }
  if (shouldIncludeInAverage(row, 'classwork')) {
    ratings.classwork = row.classworkRating;
  }
  if (shouldIncludeInAverage(row, 'discipline')) {
    ratings.discipline = row.disciplineRating;
  }
  if (shouldIncludeInAverage(row, 'practical')) {
    ratings.practical = row.practicalRating;
  }
  if (shouldIncludeInAverage(row, 'reading')) {
    ratings.reading = row.readingRating;
  }
  if (shouldIncludeInAverage(row, 'writing')) {
    ratings.writing = row.writingRating;
  }
  
  const values = Object.values(ratings);
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  const average = sum / values.length;
  return Math.round(average * 10) / 10;
};

// Check if student has any changes from default
const hasAnyChange = (original: ActivityRow, current: ActivityRow) => {
  return JSON.stringify(original) !== JSON.stringify(current);
};

// Component for remarks input - completely isolated to prevent re-renders
const RemarksCell = React.memo(({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, 500);
  };

  return (
    <Textarea
      value={localValue}
      onChange={(e) => handleChange(e.currentTarget.value)}
      size="xs"
      placeholder="Remarks..."
      autosize
      minRows={1}
      maxRows={3}
      styles={{ input: { fontSize: '12px' } }}
    />
  );
});

RemarksCell.displayName = 'RemarksCell';

export function StudentActivityPage() {
  const queryClient = useQueryClient();
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [activePeriod, setActivePeriod] = useState<number>(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate().toString());
  const [activityData, setActivityData] = useState<ActivityRow[]>([]);
  const [originalData, setOriginalData] = useState<ActivityRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE_COLUMNS);
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');

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

  const selectedClass = classes?.find(c => c._id === selectedClassId);
  const periodCount = selectedClass?.periodCount || 5;

  const { data: routine } = useQuery({
    queryKey: ['classRoutine', selectedClassId, selectedSeasonId, selectedSection, activePeriod],
    queryFn: async () => {
      if (!selectedClassId || !selectedSeasonId || !selectedSection) return null;
      const res = await api.get(`/class-sections?seasonId=${selectedSeasonId}&classId=${selectedClassId}`);
      const cs = res.data.find((c: any) => {
        const csClassId = typeof c.classId === 'string' ? c.classId : c.classId?._id;
        return csClassId === selectedClassId;
      });
      if (cs) {
        const section = cs.sections.find((s: any) => s.name === selectedSection);
        if (section && section.routine && section.routine[0]) {
          return section.routine[0][activePeriod - 1];
        }
      }
      return null;
    },
    enabled: !!selectedClassId && !!selectedSeasonId && !!selectedSection,
  });

  const getSectionsForClass = () => {
    if (!classSections || !selectedClassId) return [];
    const cs = classSections.find(c => {
      const csClassId = typeof c.classId === 'string' ? c.classId : (c.classId as any)?._id;
      return csClassId === selectedClassId;
    });
    return cs?.sections.map(s => ({ value: s.name, label: s.name })) || [];
  };

  // Fetch academic records
  const { data: academicRecords, isLoading: studentsLoading, refetch: refetchStudents } = useQuery<AcademicRecordPopulated[]>({
    queryKey: ['academicRecords', selectedSeasonId],
    queryFn: () => api.get(`/academic-records?seasonId=${selectedSeasonId}`).then(res => res.data),
    enabled: !!selectedSeasonId,
  });

  // Filter academic records by classId and section
  const filteredRecords = useMemo(() => {
    if (!academicRecords) return [];
    return academicRecords.filter(record => {
      const recordClassId = typeof record.classId === 'string' ? record.classId : record.classId?._id;
      return recordClassId === selectedClassId && record.section === selectedSection;
    });
  }, [academicRecords, selectedClassId, selectedSection]);

  // Fetch existing activities
  const { data: existingActivities, refetch: refetchActivities } = useQuery({
    queryKey: ['studentActivities', selectedSeasonId, selectedClassId, selectedSection, activePeriod, selectedYear, selectedMonth, selectedDay],
    queryFn: () => api.get(`/student-activities?seasonId=${selectedSeasonId}&classId=${selectedClassId}&section=${selectedSection}&period=${activePeriod}&date=${selectedDate.toISOString()}`).then(res => res.data),
    enabled: !!selectedSeasonId && !!selectedClassId && !!selectedSection,
  });

  // Load data into table - with DEFAULT VALUES
  useEffect(() => {
    if (filteredRecords.length > 0) {
      const records = filteredRecords.map((record) => {
        const studentId = typeof record.studentId === 'string' ? record.studentId : record.studentId._id;
        const studentName = typeof record.studentId === 'string' ? 'Loading...' : record.studentId.name;
        const existing = existingActivities?.find((a: any) => {
          const aStudentId = typeof a.studentId === 'string' ? a.studentId : a.studentId._id;
          return aStudentId === studentId;
        });
        
        const homeworkStatus = existing?.homeworkStatus || 'not_submitted';
        const classworkStatus = existing?.classworkStatus || 'not_submitted';
        const disciplineStatus = existing?.disciplineStatus || 'good';
        const healthStatus = existing?.healthStatus || 'good';
        const practicalStatus = existing?.practicalStatus || 'not_done';
        const readingStatus = existing?.readingStatus || 'not_done';
        const writingStatus = existing?.writingStatus || 'not_done';
        
        const homeworkRating = getRating(homeworkStatus, HOMEWORK_OPTIONS);
        const classworkRating = getRating(classworkStatus, CLASSWORK_OPTIONS);
        const disciplineRating = getRating(disciplineStatus, DISCIPLINE_OPTIONS);
        const practicalRating = getRating(practicalStatus, PRACTICAL_OPTIONS);
        const readingRating = getRating(readingStatus, READING_OPTIONS);
        const writingRating = getRating(writingStatus, WRITING_OPTIONS);
        
        const row = {
          studentId,
          studentName,
          rollNumber: record.rollNumber,
          homeworkStatus,
          homeworkIssue: existing?.homeworkIssue || '',
          homeworkRating,
          classworkStatus,
          classworkIssue: existing?.classworkIssue || '',
          classworkRating,
          disciplineStatus,
          disciplineIssue: existing?.disciplineIssue || '',
          disciplineRating,
          healthStatus,
          healthProblems: existing?.healthProblems || [],
          practicalStatus,
          practicalRating,
          readingStatus,
          readingRating,
          writingStatus,
          writingRating,
          averageMarks: 0,
          remarks: existing?.remarks || '',
        };
        row.averageMarks = calculateAverage(row);
        return row;
      });
      setActivityData(records);
      setOriginalData(JSON.parse(JSON.stringify(records)));
    } else {
      setActivityData([]);
      setOriginalData([]);
    }
  }, [filteredRecords, existingActivities]);

  // Save mutation - saves ONLY records that have changes
  const saveMutation = useMutation({
    mutationFn: async (data: ActivityRow[]) => {
      // Only save records that have changes
      const changedRecords = data.filter((record, index) => {
        return hasAnyChange(originalData[index], record);
      });
      
      if (changedRecords.length === 0) {
        throw new Error('No changes to save');
      }
      
      const activities = changedRecords.map(record => ({
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
      
      const response = await api.post('/student-activities/bulk', {
        seasonId: selectedSeasonId,
        classId: selectedClassId,
        section: selectedSection,
        period: activePeriod,
        date: selectedDate,
        activities,
      });
      return response.data;
    },
    onSuccess: () => {
      setIsSaving(false);
      setOriginalData(JSON.parse(JSON.stringify(activityData)));
      refetchActivities();
      notifications.show({ title: 'Success', message: `Activities saved for Period ${activePeriod}`, color: 'green' });
    },
    onError: (err: any) => {
      setIsSaving(false);
      const message = err.response?.data?.message || err.message || 'Failed to save';
      if (message !== 'No changes to save') {
        notifications.show({ title: 'Error', message, color: 'red' });
      }
    },
  });

  const hasChanges = () => {
    return activityData.some((record, index) => hasAnyChange(originalData[index], record));
  };

  const handleSave = () => {
    if (!selectedSeasonId || !selectedClassId || !selectedSection) {
      notifications.show({ title: 'Error', message: 'Please select season, class, and section', color: 'red' });
      return;
    }
    if (activityData.length === 0) {
      notifications.show({ title: 'Info', message: 'No students found for the selected criteria', color: 'blue' });
      return;
    }
    setIsSaving(true);
    saveMutation.mutate(activityData);
  };

  const updateField = useCallback((studentId: string, field: string, value: any) => {
    setActivityData(prev => prev.map(student => {
      if (student.studentId !== studentId) return student;
      
      const updated = { ...student, [field]: value };
      
      // Update ratings based on status changes
      if (field === 'homeworkStatus') {
        updated.homeworkRating = getRating(value, HOMEWORK_OPTIONS);
      }
      if (field === 'classworkStatus') {
        updated.classworkRating = getRating(value, CLASSWORK_OPTIONS);
      }
      if (field === 'disciplineStatus') {
        updated.disciplineRating = getRating(value, DISCIPLINE_OPTIONS);
      }
      if (field === 'practicalStatus') {
        updated.practicalRating = getRating(value, PRACTICAL_OPTIONS);
      }
      if (field === 'readingStatus') {
        updated.readingRating = getRating(value, READING_OPTIONS);
      }
      if (field === 'writingStatus') {
        updated.writingRating = getRating(value, WRITING_OPTIONS);
      }
      
      // Recalculate average
      updated.averageMarks = calculateAverage(updated);
      
      return updated;
    }));
  }, []);

  const updateRemarks = useCallback((studentId: string, value: string) => {
    setActivityData(prev => prev.map(student => 
      student.studentId === studentId ? { ...student, remarks: value } : student
    ));
  }, []);

  const handleRefresh = () => {
    refetchActivities();
    refetchStudents();
  };

  const toggleColumn = (columnId: string) => {
    setVisibleColumns(prev => 
      prev.includes(columnId) ? prev.filter(c => c !== columnId) : [...prev, columnId]
    );
  };

  const periodTabs = Array.from({ length: periodCount }, (_, i) => i + 1);

  // Filter data for search
  const filteredData = useMemo(() => {
    if (!globalFilter) return activityData;
    const searchTerm = globalFilter.toLowerCase();
    return activityData.filter(student => 
      student.studentName.toLowerCase().includes(searchTerm) ||
      student.rollNumber.toLowerCase().includes(searchTerm)
    );
  }, [activityData, globalFilter]);

  const columnHelper = createColumnHelper<ActivityRow>();
  const columns = useMemo(() => {
    const cols: any[] = [];
    
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
            <Select
              value={row.original.homeworkStatus}
              onChange={(val) => updateField(row.original.studentId, 'homeworkStatus', val)}
              data={HOMEWORK_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }))}
              size="xs"
              styles={{ input: { fontSize: '12px' } }}
            />
            {row.original.homeworkStatus !== 'complete' && (
              <Select
                value={row.original.homeworkIssue}
                onChange={(val) => updateField(row.original.studentId, 'homeworkIssue', val)}
                data={HOMEWORK_ISSUES.map(issue => ({ value: issue, label: issue }))}
                size="xs"
                placeholder="Issue"
                searchable
                clearable
                styles={{ input: { fontSize: '12px' } }}
              />
            )}
          </Stack>
        ),
      }));
    }
    if (visibleColumns.includes('homeworkIssue')) {
      cols.push(columnHelper.display({
        id: 'homeworkIssue',
        header: 'Homework Issue',
        size: 180,
        cell: ({ row }) => (
          <Select
            value={row.original.homeworkIssue}
            onChange={(val) => updateField(row.original.studentId, 'homeworkIssue', val)}
            data={HOMEWORK_ISSUES.map(issue => ({ value: issue, label: issue }))}
            size="xs"
            placeholder="Issue"
            searchable
            clearable
            styles={{ input: { fontSize: '12px' } }}
          />
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
            <Select
              value={row.original.classworkStatus}
              onChange={(val) => updateField(row.original.studentId, 'classworkStatus', val)}
              data={CLASSWORK_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }))}
              size="xs"
              styles={{ input: { fontSize: '12px' } }}
            />
            {row.original.classworkStatus !== 'complete' && (
              <Select
                value={row.original.classworkIssue}
                onChange={(val) => updateField(row.original.studentId, 'classworkIssue', val)}
                data={CLASSWORK_ISSUES.map(issue => ({ value: issue, label: issue }))}
                size="xs"
                placeholder="Issue"
                searchable
                clearable
                styles={{ input: { fontSize: '12px' } }}
              />
            )}
          </Stack>
        ),
      }));
    }
    if (visibleColumns.includes('classworkIssue')) {
      cols.push(columnHelper.display({
        id: 'classworkIssue',
        header: 'Classwork Issue',
        size: 180,
        cell: ({ row }) => (
          <Select
            value={row.original.classworkIssue}
            onChange={(val) => updateField(row.original.studentId, 'classworkIssue', val)}
            data={CLASSWORK_ISSUES.map(issue => ({ value: issue, label: issue }))}
            size="xs"
            placeholder="Issue"
            searchable
            clearable
            styles={{ input: { fontSize: '12px' } }}
          />
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
            <Select
              value={row.original.disciplineStatus}
              onChange={(val) => updateField(row.original.studentId, 'disciplineStatus', val)}
              data={DISCIPLINE_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }))}
              size="xs"
              styles={{ input: { fontSize: '12px' } }}
            />
            {row.original.disciplineStatus !== 'good' && (
              <Select
                value={row.original.disciplineIssue}
                onChange={(val) => updateField(row.original.studentId, 'disciplineIssue', val)}
                data={DISCIPLINE_ISSUES.map(issue => ({ value: issue, label: issue }))}
                size="xs"
                placeholder="Issue"
                searchable
                styles={{ input: { fontSize: '12px' } }}
              />
            )}
          </Stack>
        ),
      }));
    }
    if (visibleColumns.includes('disciplineIssue')) {
      cols.push(columnHelper.display({
        id: 'disciplineIssue',
        header: 'Discipline Issue',
        size: 180,
        cell: ({ row }) => (
          <Select
            value={row.original.disciplineIssue}
            onChange={(val) => updateField(row.original.studentId, 'disciplineIssue', val)}
            data={DISCIPLINE_ISSUES.map(issue => ({ value: issue, label: issue }))}
            size="xs"
            placeholder="Issue"
            searchable
            styles={{ input: { fontSize: '12px' } }}
          />
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
            <Select
              value={row.original.healthStatus}
              onChange={(val) => updateField(row.original.studentId, 'healthStatus', val)}
              data={HEALTH_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }))}
              size="xs"
              styles={{ input: { fontSize: '12px' } }}
            />
            {row.original.healthStatus !== 'good' && (
              <MultiSelect
                value={row.original.healthProblems}
                onChange={(val) => updateField(row.original.studentId, 'healthProblems', val)}
                data={HEALTH_PROBLEMS.map(p => ({ value: p, label: p }))}
                size="xs"
                placeholder="Problems"
                clearable
                styles={{ input: { fontSize: '12px' } }}
              />
            )}
          </Stack>
        ),
      }));
    }
    if (visibleColumns.includes('healthProblems')) {
      cols.push(columnHelper.display({
        id: 'healthProblems',
        header: 'Health Problems',
        size: 200,
        cell: ({ row }) => (
          <MultiSelect
            value={row.original.healthProblems}
            onChange={(val) => updateField(row.original.studentId, 'healthProblems', val)}
            data={HEALTH_PROBLEMS.map(p => ({ value: p, label: p }))}
            size="xs"
            placeholder="Problems"
            clearable
            styles={{ input: { fontSize: '12px' } }}
          />
        ),
      }));
    }
    if (visibleColumns.includes('practicalStatus')) {
      cols.push(columnHelper.display({
        id: 'practicalStatus',
        header: '🔬 Practical (0-4)',
        size: 180,
        cell: ({ row }) => (
          <Select
            value={row.original.practicalStatus}
            onChange={(val) => updateField(row.original.studentId, 'practicalStatus', val)}
            data={PRACTICAL_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }))}
            size="xs"
            styles={{ input: { fontSize: '12px' } }}
          />
        ),
      }));
    }
    if (visibleColumns.includes('readingStatus')) {
      cols.push(columnHelper.display({
        id: 'readingStatus',
        header: '📖 Reading (0-4)',
        size: 180,
        cell: ({ row }) => (
          <Select
            value={row.original.readingStatus}
            onChange={(val) => updateField(row.original.studentId, 'readingStatus', val)}
            data={READING_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }))}
            size="xs"
            styles={{ input: { fontSize: '12px' } }}
          />
        ),
      }));
    }
    if (visibleColumns.includes('writingStatus')) {
      cols.push(columnHelper.display({
        id: 'writingStatus',
        header: '✍️ Writing (0-4)',
        size: 180,
        cell: ({ row }) => (
          <Select
            value={row.original.writingStatus}
            onChange={(val) => updateField(row.original.studentId, 'writingStatus', val)}
            data={WRITING_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }))}
            size="xs"
            styles={{ input: { fontSize: '12px' } }}
          />
        ),
      }));
    }
    if (visibleColumns.includes('averageMarks')) {
      cols.push(columnHelper.display({
        id: 'averageMarks',
        header: '⭐ Average (0-4)',
        size: 120,
        cell: ({ row }) => (
          <Tooltip label="Average includes Homework, Classwork, Practical, Discipline, Reading, Writing (only if status changed from default OR issue entered)" withArrow>
            <Badge color={row.original.averageMarks >= 3 ? 'green' : row.original.averageMarks >= 2 ? 'yellow' : 'red'} size="lg">
              {row.original.averageMarks.toFixed(1)} / 4
            </Badge>
          </Tooltip>
        ),
      }));
    }
    if (visibleColumns.includes('remarks')) {
      cols.push(columnHelper.display({
        id: 'remarks',
        header: 'Remarks',
        size: 200,
        cell: ({ row }) => (
          <RemarksCell
            value={row.original.remarks}
            onChange={(val) => updateRemarks(row.original.studentId, val)}
          />
        ),
      }));
    }
    return cols;
  }, [visibleColumns, activityData, updateField, updateRemarks]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 100 } },
  });

  return (
    <Stack p="md" gap="md">
      <Title order={1}>Student Activity Tracker</Title>
      
      <Group grow align="flex-end">
        <Select
          label="Academic Season"
          placeholder="Select season"
          data={seasons?.map(s => ({ value: s._id, label: s.name })) || []}
          value={selectedSeasonId}
          onChange={(val) => {
            setSelectedSeasonId(val || '');
            setSelectedClassId('');
            setSelectedSection('');
            setActivityData([]);
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
            setActivityData([]);
          }}
          disabled={!selectedSeasonId}
        />
        <Select
          label="Section"
          placeholder="Select section"
          data={getSectionsForClass()}
          value={selectedSection}
          onChange={(val) => {
            setSelectedSection(val || '');
            setActivityData([]);
          }}
          disabled={!selectedClassId}
        />
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
        <Group>
          <Text>📅 {selectedDate.toLocaleDateString()} ({dayOfWeek})</Text>
          <Divider orientation="vertical" />
          <Text fw={600}>👨‍🏫 Teacher: {routine?.teacher || 'Not assigned'}</Text>
          <Text fw={600}>📚 Subject: {routine?.subject || 'Not assigned'}</Text>
          <Divider orientation="vertical" />
          <Text fw={600}>⏱️ Periods: {periodCount}</Text>
          {hasChanges() && <Badge color="orange" ml="md">Unsaved changes</Badge>}
        </Group>
      </Alert>

      <Group justify="space-between">
        <Group>
          <Tabs value={activePeriod.toString()} onChange={(val) => setActivePeriod(parseInt(val || '1'))}>
            <Tabs.List>
              {periodTabs.map(p => <Tabs.Tab key={p} value={p.toString()}>Period {p}</Tabs.Tab>)}
            </Tabs.List>
          </Tabs>
        </Group>
        <Group>
          <TextInput
            placeholder="Search by name or roll number"
            leftSection={<IconSearch size={16} />}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.currentTarget.value)}
            size="sm"
            style={{ width: 250 }}
          />
          <Tooltip label="Refresh">
            <ActionIcon onClick={handleRefresh} variant="light" size="lg">
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
          <Button 
            variant="light" 
            leftSection={<IconSettings size={16} />} 
            onClick={() => setDrawerOpened(true)}
          >
            Columns
          </Button>
          <Button 
            color="green" 
            leftSection={<IconDeviceFloppy size={16} />} 
            onClick={handleSave} 
            loading={isSaving}
            disabled={!hasChanges() || activityData.length === 0}
          >
            Save All Changes
          </Button>
        </Group>
      </Group>

      {studentsLoading && <Loader />}
      {!selectedSection && selectedClassId && <Alert color="yellow">Please select a section to view students.</Alert>}
      {selectedSection && filteredRecords.length === 0 && !studentsLoading && (
        <Alert color="blue">No students found for the selected class and section.</Alert>
      )}

      {activityData.length > 0 && (
        <Paper withBorder style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
          <Box style={{ minWidth: visibleColumns.length * 150 }}>
            <DataTable table={table} />
          </Box>
        </Paper>
      )}

      <Drawer opened={drawerOpened} onClose={() => setDrawerOpened(false)} title="Select Columns to Display" position="right" size="md">
        <Stack>
          {ALL_COLUMNS.map(col => (
            <Checkbox
              key={col.id}
              label={col.label}
              checked={visibleColumns.includes(col.id)}
              onChange={() => toggleColumn(col.id)}
            />
          ))}
          <Divider my="md" />
          <Group>
            <Button onClick={() => setVisibleColumns(ALL_COLUMNS.map(c => c.id))}>Select All</Button>
            <Button variant="light" onClick={() => setVisibleColumns(DEFAULT_VISIBLE_COLUMNS)}>Reset to Default</Button>
          </Group>
        </Stack>
      </Drawer>
    </Stack>
  );
}