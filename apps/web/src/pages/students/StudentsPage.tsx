import { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  Button, Modal, TextInput, Select, Group, Title, Stack, Loader, Badge, 
  Text, Card, Tooltip, ActionIcon, Box, Skeleton, Paper, ScrollArea
} from '@mantine/core';
import { 
  IconUserPlus, IconPlus, IconEye, IconSearch, IconPhone, 
  IconUsers, IconDroplet, IconCalendar, IconSchool
} from '@tabler/icons-react';
import { api } from '../../lib/api';
import { AcademicSeason, Student, AcademicRecord, Class, ClassSection } from '../../lib/types';
import { notifications } from '@mantine/notifications';
import { AddStudentWizardModal } from './AddStudentWizardModal';
import { ParentDetailsModal } from './ParentDetailsModal';
import { StudentDetailDrawer } from './StudentDetailDrawer';

// Student Row Component
const StudentRow = ({ student, style, handleParentClick, handleStudentClick, selectedSeasonId, getEnrollment, index }: any) => {
  const enrollment = getEnrollment(student._id);
  
  return (
    <div style={style}>
      <Paper 
        withBorder 
        radius="md" 
        p="sm" 
        mb="xs" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '8px',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          borderLeft: `3px solid ${index % 2 === 0 ? '#228be6' : '#40c057'}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f8f9fa';
          e.currentTarget.style.transform = 'translateX(4px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.transform = 'translateX(0)';
        }}
      >
        {/* Student ID */}
        <div style={{ minWidth: 130 }}>
          <Text size="xs" c="dimmed">Student ID</Text>
          <Text fw={600} size="sm">{student.studentId}</Text>
        </div>
        
        {/* Name */}
        <div style={{ minWidth: 150 }}>
          <Text size="xs" c="dimmed">Name</Text>
          <Text fw={600} size="sm">{student.name}</Text>
        </div>
        
        {/* Blood Group */}
        <div style={{ minWidth: 80 }}>
          <Text size="xs" c="dimmed">Blood Group</Text>
          <Badge color="violet" variant="light" size="sm">{student.bloodGroup || '—'}</Badge>
        </div>
        
        {/* Parents */}
        <div style={{ minWidth: 200 }}>
          <Text size="xs" c="dimmed">Parents</Text>
          <Stack gap={4}>
            {student.parents?.slice(0, 2).map((p: any, idx: number) => (
              <Group key={idx} gap={4}>
                <Badge size="xs" variant="light">{p.relation}</Badge>
                <Button variant="subtle" size="xs" onClick={() => handleParentClick(p, student)}>
                  {p.name}
                </Button>
                <Tooltip label={p.phone}><IconPhone size={12} color="gray" /></Tooltip>
              </Group>
            ))}
            {student.parents && student.parents.length > 2 && (
              <Text size="xs" c="dimmed">+{student.parents.length - 2} more</Text>
            )}
          </Stack>
        </div>
        
        {/* Current Enrollment */}
        <div style={{ minWidth: 180 }}>
          <Text size="xs" c="dimmed">Current Enrollment</Text>
          {!selectedSeasonId ? (
            <Text c="dimmed" size="xs">Select season</Text>
          ) : !enrollment ? (
            <Badge color="gray" size="sm">Not enrolled</Badge>
          ) : (
            <div>
              <Badge color="blue" variant="light" size="sm">
                {(enrollment.classId as any)?.displayName}
              </Badge>
              <Text size="xs" mt={2}>Sec: {enrollment.section} | Roll: {enrollment.rollNumber || '—'}</Text>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div>
          <Group gap={4}>
            <Tooltip label="View Details">
              <ActionIcon 
                variant="light" 
                color="blue" 
                onClick={() => handleStudentClick(student)}
                size="lg"
              >
                <IconEye size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Enroll">
              <ActionIcon 
                variant="light" 
                color="green" 
                onClick={() => {}} 
                disabled={!selectedSeasonId}
                size="lg"
              >
                <IconPlus size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </div>
      </Paper>
    </div>
  );
};

export function StudentsPage() {
  const queryClient = useQueryClient();
  const parentRef = useRef(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [parentModalOpen, setParentModalOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<any>(null);
  const [parentChildren, setParentChildren] = useState([]);
  const [currentStudentAddress, setCurrentStudentAddress] = useState({ permanent: '', temporary: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [enrollForm, setEnrollForm] = useState({ classId: '', section: '', rollNumber: '' });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const schoolId = user.schoolId;

  // Queries with caching
  const { data: seasons = [] } = useQuery<AcademicSeason[]>({
    queryKey: ['seasons'],
    queryFn: () => api.get('/academic-seasons').then(res => res.data),
    staleTime: 10 * 60 * 1000,
  });

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then(res => res.data),
    staleTime: 10 * 60 * 1000,
  });

  const { data: students = [], isLoading: studentsLoading, refetch: refetchStudents } = useQuery<Student[]>({
    queryKey: ['students', schoolId],
    queryFn: () => api.get('/students').then(res => res.data),
    enabled: !!schoolId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: records = [] } = useQuery<AcademicRecord[]>({
    queryKey: ['academicRecords', selectedSeasonId],
    queryFn: () => api.get(`/academic-records?seasonId=${selectedSeasonId}`).then(res => res.data),
    enabled: !!selectedSeasonId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: classSections = [] } = useQuery<ClassSection[]>({
    queryKey: ['classSections', selectedSeasonId],
    queryFn: () => api.get(`/class-sections?seasonId=${selectedSeasonId}`).then(res => res.data),
    enabled: !!selectedSeasonId,
    staleTime: 5 * 60 * 1000,
  });

  const getSectionsForClass = useCallback((classId: string) => {
    if (!classSections.length) return [];
    const cs = classSections.find(c => {
      const csClassId = typeof c.classId === 'string' ? c.classId : (c.classId as any)?._id;
      return csClassId === classId;
    });
    return cs?.sections.map(s => s.name) || [];
  }, [classSections]);

  const addEnrollmentMutation = useMutation({
    mutationFn: (data: any) => api.post('/academic-records', { ...data, seasonId: selectedSeasonId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicRecords'] });
      setEnrollOpen(false);
      notifications.show({ title: 'Success', message: 'Enrollment added', color: 'green' });
    },
  });

  const getEnrollment = useCallback((studentId: string) => {
    return records.find(r => (typeof r.studentId === 'string' ? r.studentId : r.studentId._id) === studentId);
  }, [records]);

  const handleParentClick = useCallback(async (parent: any, student: Student) => {
    setCurrentStudentAddress({
      permanent: student.permanentAddress || '—',
      temporary: student.temporaryAddress || (student.sameAddress ? student.permanentAddress : '—'),
    });
    const res = await api.get(`/students/parent-children?phone=${encodeURIComponent(parent.phone)}`);
    const enriched = res.data.map((child: any) => ({
      ...child,
      currentClass: getEnrollment(child._id) ? (getEnrollment(child._id)?.classId as any)?.displayName : 'Not enrolled',
    }));
    setParentChildren(enriched);
    setSelectedParent(parent);
    setParentModalOpen(true);
  }, [getEnrollment]);

  const handleStudentClick = useCallback((student: Student) => {
    setSelectedStudent(student);
    setDetailDrawerOpen(true);
  }, []);

  const handleSearch = useCallback(async () => {
    if (searchQuery.length >= 2) {
      const res = await api.get(`/students/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data);
    }
  }, [searchQuery]);

  const handleEnroll = () => addEnrollmentMutation.mutate({ studentId: selectedStudentId, ...enrollForm });

  // Virtualizer for large lists
  const displayData = searchResults.length > 0 ? searchResults : students;
  const rowVirtualizer = useVirtualizer({
    count: displayData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 95,
    overscan: 5,
  });

  if (!schoolId) return <Loader />;

  return (
    <Stack p="md" gap="md">
      <Title order={1}>Student Management</Title>
      
      {/* Filter Bar */}
      <Paper withBorder radius="md" p="sm" shadow="sm">
        <Group justify="space-between">
          <Group gap="sm">
            <TextInput
              placeholder="Search by name, ID, or parent phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              style={{ width: 280 }}
              leftSection={<IconSearch size={16} />}
            />
            <Button onClick={handleSearch} variant="light" size="sm">Search</Button>
            {(searchResults.length > 0 || searchQuery) && (
              <Button variant="subtle" size="sm" onClick={() => { setSearchQuery(''); setSearchResults([]); }}>
                Clear
              </Button>
            )}
          </Group>
          <Group gap="sm">
            <Select
              placeholder="Filter by Season"
              data={seasons.map(s => ({ value: s._id, label: s.name }))}
              value={selectedSeasonId}
              onChange={setSelectedSeasonId}
              clearable
              style={{ width: 180 }}
              size="sm"
            />
            <Button leftSection={<IconUserPlus size={16} />} onClick={() => setWizardOpen(true)} variant="filled" size="sm">
              Add Student
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Student List - Virtualized */}
      {studentsLoading ? (
        <Stack>
          {[...Array(5)].map((_, i) => <Skeleton key={i} height={95} radius="md" />)}
        </Stack>
      ) : displayData.length === 0 ? (
        <Paper withBorder p="xl" ta="center">
          <Text c="dimmed">No students found</Text>
        </Paper>
      ) : (
        <Paper withBorder radius="md" p="sm" style={{ backgroundColor: '#f8f9fa' }}>
          {/* Table Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            flexWrap: 'wrap', 
            gap: '8px',
            padding: '12px 8px',
            borderBottom: '2px solid #dee2e6',
            marginBottom: '8px',
            fontWeight: 600,
            color: '#495057'
          }}>
            <div style={{ minWidth: 130 }}>Student ID</div>
            <div style={{ minWidth: 150 }}>Name</div>
            <div style={{ minWidth: 80 }}>Blood Group</div>
            <div style={{ minWidth: 200 }}>Parents</div>
            <div style={{ minWidth: 180 }}>Current Enrollment</div>
            <div style={{ minWidth: 80 }}>Actions</div>
          </div>
          
          <div ref={parentRef} style={{ height: 'calc(100vh - 280px)', overflow: 'auto' }}>
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                <div key={virtualRow.key} style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualRow.start}px)` }}>
                  <StudentRow 
                    student={displayData[virtualRow.index]}
                    index={virtualRow.index}
                    handleParentClick={handleParentClick}
                    handleStudentClick={handleStudentClick}
                    selectedSeasonId={selectedSeasonId}
                    getEnrollment={getEnrollment}
                  />
                </div>
              ))}
            </div>
          </div>
        </Paper>
      )}

      {/* Modals */}
      {wizardOpen && <AddStudentWizardModal opened={wizardOpen} onClose={() => setWizardOpen(false)} onSuccess={(newStudentId) => { refetchStudents(); if (selectedSeasonId) { setSelectedStudentId(newStudentId); setEnrollOpen(true); } }} existingStudentCount={students.length} />}
      
      {enrollOpen && (
        <Modal opened={enrollOpen} onClose={() => setEnrollOpen(false)} title="Enroll in Season" size="sm">
          <Select label="Class" data={classes.map(c => ({ value: c._id, label: c.displayName }))} value={enrollForm.classId} onChange={(val) => setEnrollForm({ ...enrollForm, classId: val || '', section: '' })} required />
          <Select label="Section" data={getSectionsForClass(enrollForm.classId).map(sec => ({ value: sec, label: sec }))} value={enrollForm.section} onChange={(val) => setEnrollForm({ ...enrollForm, section: val || '' })} disabled={!enrollForm.classId} clearable mt="md" />
          <TextInput label="Roll Number" value={enrollForm.rollNumber} onChange={(e) => setEnrollForm({ ...enrollForm, rollNumber: e.target.value })} mt="md" />
          <Group justify="flex-end" mt="md"><Button onClick={handleEnroll}>Enroll</Button></Group>
        </Modal>
      )}

      {selectedParent && (
        <ParentDetailsModal 
          parent={selectedParent} 
          children={parentChildren} 
          studentAddress={currentStudentAddress} 
          opened={parentModalOpen} 
          onClose={() => setParentModalOpen(false)} 
        />
      )}
      
      {selectedStudent && (
        <StudentDetailDrawer 
          opened={detailDrawerOpen} 
          onClose={() => setDetailDrawerOpen(false)} 
          student={selectedStudent} 
          selectedSeasonId={selectedSeasonId} 
        />
      )}
    </Stack>
  );
}