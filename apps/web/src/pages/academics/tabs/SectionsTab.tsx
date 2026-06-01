import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Select, Button, Group, Title, Stack, Loader, Alert, Badge, 
  Table, ActionIcon, Tooltip, Modal, TextInput, Textarea,
  MultiSelect, Divider, Paper, Text, ThemeIcon, Card, SimpleGrid, Box,
  Checkbox, Avatar
} from '@mantine/core';
import { IconHistory, IconRefresh, IconUser, IconBook, IconCalendar, IconPlus, IconTrash, IconEdit, IconSchool } from '@tabler/icons-react';
import { api } from '../../../lib/api';
import { notifications } from '@mantine/notifications';

const DAY_OPTIONS = [
  { value: 'M', label: 'Monday' },
  { value: 'T', label: 'Tuesday' },
  { value: 'W', label: 'Wednesday' },
  { value: 'Th', label: 'Thursday' },
  { value: 'F', label: 'Friday' },
];

const DAY_PRESETS = [
  { label: 'All Week', value: ['M', 'T', 'W', 'Th', 'F'], icon: '📅' },
  { label: 'Mon, Wed, Fri', value: ['M', 'W', 'F'], icon: '📆' },
  { label: 'Tue, Thu', value: ['T', 'Th'], icon: '📖' },
  { label: 'Mon, Tue, Wed', value: ['M', 'T', 'W'], icon: '📘' },
  { label: 'Wed, Thu, Fri', value: ['W', 'Th', 'F'], icon: '📙' },
  { label: 'Mon, Tue', value: ['M', 'T'], icon: '📗' },
  { label: 'Thu, Fri', value: ['Th', 'F'], icon: '📕' },
  { label: 'Only Monday', value: ['M'], icon: '🔵' },
  { label: 'Only Friday', value: ['F'], icon: '🔴' },
];

const DAY_MAP: Record<string, string> = {
  M: 'Mon', T: 'Tue', W: 'Wed', Th: 'Thu', F: 'Fri'
};

export function RoutineTab() {
  const queryClient = useQueryClient();
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [endingAssignment, setEndingAssignment] = useState<{ period: number; teacherId: string; teacherName: string } | null>(null);
  const [endReason, setEndReason] = useState('');
  const [assignForm, setAssignForm] = useState({ 
    teacherId: '', 
    subjectId: '', 
    days: [] as string[], 
    allDays: false 
  });
  const [periodHistory, setPeriodHistory] = useState<any[]>([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const schoolId = user.schoolId;

  // Fetch seasons
  const { data: seasons } = useQuery({
    queryKey: ['seasons', schoolId],
    queryFn: () => api.get('/academic-seasons', { headers: { 'X-School-Id': schoolId } }).then(res => res.data),
    enabled: !!schoolId,
  });

  // Fetch classes
  const { data: classes } = useQuery({
    queryKey: ['classes', schoolId],
    queryFn: () => api.get('/classes', { headers: { 'X-School-Id': schoolId } }).then(res => res.data),
    enabled: !!schoolId,
  });

  // Fetch teachers
  const { data: teachers } = useQuery({
    queryKey: ['teachers', schoolId],
    queryFn: () => api.get('/teachers', { headers: { 'X-School-Id': schoolId } }).then(res => res.data),
    enabled: !!schoolId,
  });

  // Fetch subjects
  const { data: subjects } = useQuery({
    queryKey: ['subjects', selectedSeasonId, selectedClassId, schoolId],
    queryFn: async () => {
      if (!selectedSeasonId || !selectedClassId) return [];
      const response = await api.get(`/subjects`, { 
        params: { seasonId: selectedSeasonId, classId: selectedClassId },
        headers: { 'X-School-Id': schoolId } 
      });
      return response.data;
    },
    enabled: !!selectedSeasonId && !!selectedClassId && !!schoolId,
  });

  // Fetch sections
  const { data: sections, refetch: refetchSections } = useQuery({
    queryKey: ['sections', selectedSeasonId, selectedClassId, schoolId],
    queryFn: async () => {
      if (!selectedSeasonId || !selectedClassId) return [];
      const response = await api.get(`/sections`, { 
        params: { seasonId: selectedSeasonId, classId: selectedClassId },
        headers: { 'X-School-Id': schoolId } 
      });
      return response.data;
    },
    enabled: !!selectedSeasonId && !!selectedClassId && !!schoolId,
  });

  // Fetch single section data
  const { data: section, refetch: refetchSection } = useQuery({
    queryKey: ['section', selectedSectionId, schoolId],
    queryFn: async () => {
      if (!selectedSectionId) return null;
      const response = await api.get(`/sections/${selectedSectionId}`, { 
        headers: { 'X-School-Id': schoolId } 
      });
      return response.data;
    },
    enabled: !!selectedSectionId && !!schoolId,
  });

  const selectedClass = classes?.find(c => c._id === selectedClassId);
  const periodCount = selectedClass?.periodCount || 7;

  // Get all assignments for a period
  const getAssignments = (period: number) => {
    const periodTeachers = section?.periodTeachers;
    if (!periodTeachers) return [];
    const assignments = periodTeachers[period] || [];
    return assignments.filter((a: any) => !a.endDate);
  };

  // Check if a teacher covers all days
  const coversAllDays = (days: string[]) => days.length === 5 && days.includes('M') && days.includes('T') && days.includes('W') && days.includes('Th') && days.includes('F');

  // Get class teacher info - FIXED: Extract string values from objects
  const getClassTeacherInfo = () => {
    // Handle currentClassTeacherId which might be a string or an object
    let teacherName = 'Not assigned';
    let subjectName = 'Not assigned';
    
    if (section?.currentClassTeacherId) {
      // If it's an object with name property
      if (typeof section.currentClassTeacherId === 'object' && section.currentClassTeacherId !== null) {
        teacherName = (section.currentClassTeacherId as any).name || 'Not assigned';
      } 
      // If it's a string, find the teacher from the teachers array
      else if (typeof section.currentClassTeacherId === 'string') {
        const teacher = teachers?.find(t => t._id === section.currentClassTeacherId);
        teacherName = teacher?.name || 'Not assigned';
      }
    }
    
    if (section?.currentClassTeacherSubjectId) {
      // If it's an object with name property
      if (typeof section.currentClassTeacherSubjectId === 'object' && section.currentClassTeacherSubjectId !== null) {
        subjectName = (section.currentClassTeacherSubjectId as any).name || 'Not assigned';
      }
      // If it's a string, find the subject from the subjects array
      else if (typeof section.currentClassTeacherSubjectId === 'string') {
        const subject = subjects?.find(s => s._id === section.currentClassTeacherSubjectId);
        subjectName = subject?.name || 'Not assigned';
      }
    }
    
    return { teacher: teacherName, subject: subjectName };
  };

  // Assign/Update teacher mutation
  const assignMutation = useMutation({
    mutationFn: async () => {
      let daysToSend = assignForm.allDays ? ['M', 'T', 'W', 'Th', 'F'] : assignForm.days;
      if (daysToSend.length === 0) daysToSend = assignForm.days;
      
      const payload = {
        period: selectedPeriod,
        teacherId: assignForm.teacherId,
        subjectId: assignForm.subjectId,
        days: daysToSend,
        assignedDate: new Date().toISOString(),
      };
      const response = await api.post(
        `/sections/${selectedSectionId}/assign-period-teacher`, 
        payload,
        { headers: { 'X-School-Id': schoolId } }
      );
      return response.data;
    },
    onSuccess: () => {
      refetchSection();
      refetchSections();
      setAssignModalOpen(false);
      setEditingAssignment(null);
      setAssignForm({ teacherId: '', subjectId: '', days: [], allDays: false });
      notifications.show({ title: 'Success', message: 'Teacher assigned successfully', color: 'green' });
    },
    onError: (err: any) => {
      notifications.show({ 
        title: 'Error', 
        message: err.response?.data?.message || 'Failed to assign teacher', 
        color: 'red' 
      });
    },
  });

  // End assignment mutation with reason
  const endMutation = useMutation({
    mutationFn: async () => {
      if (!endingAssignment) return;
      const payload = { 
        period: endingAssignment.period, 
        teacherId: endingAssignment.teacherId, 
        endDate: new Date().toISOString(), 
        reason: endReason || 'Assignment ended by admin'
      };
      return api.post(`/sections/${selectedSectionId}/end-period-teacher`, payload, { 
        headers: { 'X-School-Id': schoolId } 
      });
    },
    onSuccess: () => {
      refetchSection();
      refetchSections();
      setEndModalOpen(false);
      setEndingAssignment(null);
      setEndReason('');
      notifications.show({ title: 'Success', message: 'Assignment ended', color: 'green' });
    },
    onError: (err: any) => {
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Failed to end assignment', color: 'red' });
    },
  });

  const getPeriodHistory = (period: number) => {
    const periodTeachers = section?.periodTeachers;
    if (!periodTeachers) return [];
    return periodTeachers[period] || [];
  };

  const classTeacherInfo = getClassTeacherInfo();

  const handleViewHistory = (period: number) => {
    setSelectedPeriod(period);
    setPeriodHistory(getPeriodHistory(period));
    setHistoryModalOpen(true);
  };

  const handleEditAssignment = (period: number, assignment: any) => {
    setEditingAssignment(assignment);
    setSelectedPeriod(period);
    setAssignForm({
      teacherId: assignment.teacherId,
      subjectId: assignment.subjectId,
      days: assignment.days,
      allDays: coversAllDays(assignment.days),
    });
    setAssignModalOpen(true);
  };

  const handleEndAssignment = (period: number, teacherId: string, teacherName: string) => {
    setEndingAssignment({ period, teacherId, teacherName });
    setEndReason('');
    setEndModalOpen(true);
  };

  const handleClassChange = (val: string | null) => {
    setSelectedClassId(val || '');
    setSelectedSectionId('');
  };

  const handleSeasonChange = (val: string | null) => {
    setSelectedSeasonId(val || '');
    setSelectedClassId('');
    setSelectedSectionId('');
  };

  const handleSectionChange = (val: string | null) => {
    setSelectedSectionId(val || '');
  };

  const handleRefresh = () => {
    if (selectedSectionId) refetchSection();
    if (selectedClassId && selectedSeasonId) refetchSections();
  };

  return (
    <Stack gap="xl">
      {/* Filters Section */}
      <Paper withBorder shadow="sm" radius="md" p="lg">
        <Group grow align="flex-end">
          <Select
            label="Academic Season"
            placeholder="Select season"
            data={seasons?.map(s => ({ value: s._id, label: s.name })) || []}
            value={selectedSeasonId}
            onChange={handleSeasonChange}
            leftSection={<IconCalendar size={16} />}
          />
          <Select
            label="Class"
            placeholder="Select class"
            data={classes?.map(c => ({ value: c._id, label: c.displayName })) || []}
            value={selectedClassId}
            onChange={handleClassChange}
            disabled={!selectedSeasonId}
            leftSection={<IconBook size={16} />}
          />
          <Select
            label="Section"
            placeholder="Select section"
            data={sections?.map(s => ({ value: s._id, label: s.name })) || []}
            value={selectedSectionId}
            onChange={handleSectionChange}
            disabled={!selectedClassId}
            leftSection={<IconUser size={16} />}
          />
          <Button variant="light" onClick={handleRefresh} disabled={!selectedSectionId} leftSection={<IconRefresh size={16} />}>
            Refresh
          </Button>
        </Group>
      </Paper>

      {selectedSectionId && section && (
        <>
          {/* Class Teacher Info */}
          <Paper withBorder shadow="sm" radius="md" p="lg" style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f9ff 100%)' }}>
            <Group justify="space-between">
              <Group>
                <Avatar size="lg" color="blue" radius="xl">
                  <IconSchool size={24} />
                </Avatar>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>👩‍🏫 Class Teacher</Text>
                  <Text fw={700} size="xl">{classTeacherInfo.teacher}</Text>
                  <Text size="sm" c="dimmed">{classTeacherInfo.subject}</Text>
                </div>
              </Group>
              <Badge size="lg" color="blue" variant="light">{periodCount} Periods per Day</Badge>
            </Group>
          </Paper>

          {/* Period-wise Multi-Teacher Table */}
          <Box style={{ overflowX: 'auto' }}>
            <Table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #e9ecef', textAlign: 'left', width: '100px' }}>Period</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #e9ecef', textAlign: 'left' }}>Teachers & Subjects</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #e9ecef', textAlign: 'center', width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: periodCount }).map((_, periodIdx) => {
                  const period = periodIdx + 1;
                  const assignments = getAssignments(period);
                  
                  return (
                    <tr key={period} style={{ borderBottom: '1px solid #e9ecef' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, background: '#f8f9fa', verticalAlign: 'top' }}>
                        <div>
                          Period {period}
                          {period === 1 && (
                            <Badge size="sm" color="green" fullWidth mt={4} style={{ display: 'block', textAlign: 'center' }}>
                              Class Teacher
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                        {assignments.length === 0 ? (
                          <Text size="sm" c="dimmed" fs="italic">— No teachers assigned —</Text>
                        ) : (
                          <Stack gap="xs">
                            {assignments.map((assignment: any, idx: number) => {
                              // Safely extract teacher name
                              let teacherName = 'Unknown';
                              if (assignment.teacherId) {
                                if (typeof assignment.teacherId === 'object') {
                                  teacherName = assignment.teacherId.name || 'Unknown';
                                } else if (typeof assignment.teacherId === 'string') {
                                  const teacher = teachers?.find(t => t._id === assignment.teacherId);
                                  teacherName = teacher?.name || 'Unknown';
                                }
                              }
                              
                              // Safely extract subject name
                              let subjectName = 'Unknown';
                              if (assignment.subjectId) {
                                if (typeof assignment.subjectId === 'object') {
                                  subjectName = assignment.subjectId.name || 'Unknown';
                                } else if (typeof assignment.subjectId === 'string') {
                                  const subject = subjects?.find(s => s._id === assignment.subjectId);
                                  subjectName = subject?.name || 'Unknown';
                                }
                              }
                              
                              const daysStr = assignment.days.map((d: string) => DAY_MAP[d]).join(', ');
                              const isFullWeek = coversAllDays(assignment.days);
                              
                              return (
                                <Card key={idx} withBorder p="xs" radius="md" style={{ background: '#fafafa' }}>
                                  <Group justify="space-between" wrap="nowrap">
                                    <div style={{ flex: 1 }}>
                                      <Group gap="xs" wrap="wrap">
                                        <Badge color="blue" variant="light">{subjectName}</Badge>
                                        <Text size="sm" fw={500}>{teacherName}</Text>
                                        {isFullWeek ? (
                                          <Badge size="xs" color="green">📅 All Days</Badge>
                                        ) : (
                                          <Badge size="xs" color="gray" variant="outline">📅 {daysStr}</Badge>
                                        )}
                                      </Group>
                                    </div>
                                    <Group gap={4}>
                                      <Tooltip label="Edit Assignment">
                                        <ActionIcon size="sm" color="blue" variant="subtle" onClick={() => handleEditAssignment(period, assignment)}>
                                          <IconEdit size={14} />
                                        </ActionIcon>
                                      </Tooltip>
                                      <Tooltip label="End Assignment">
                                        <ActionIcon size="sm" color="red" variant="subtle" onClick={() => handleEndAssignment(period, assignment.teacherId, teacherName)}>
                                          <IconTrash size={14} />
                                        </ActionIcon>
                                      </Tooltip>
                                    </Group>
                                  </Group>
                                </Card>
                              );
                            })}
                          </Stack>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'top' }}>
                        <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={() => {
                          setSelectedPeriod(period);
                          setEditingAssignment(null);
                          setAssignForm({ teacherId: '', subjectId: '', days: [], allDays: false });
                          setAssignModalOpen(true);
                        }}>
                          Add Teacher
                        </Button>
                        {assignments.length > 0 && (
                          <Tooltip label="History">
                            <ActionIcon size="sm" ml="xs" onClick={() => handleViewHistory(period)}><IconHistory size={16} /></ActionIcon>
                          </Tooltip>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Box>
        </>
      )}

      {/* No Selection States */}
      {selectedClassId && selectedSeasonId && !selectedSectionId && <Alert color="blue" variant="light">Please select a section to view and manage routine.</Alert>}
      {!selectedClassId && selectedSeasonId && <Alert color="blue" variant="light">Please select a class to continue.</Alert>}
      {!selectedSeasonId && <Alert color="blue" variant="light">Please select an academic season first.</Alert>}

      {/* Assign/Edit Teacher Modal */}
      <Modal opened={assignModalOpen} onClose={() => setAssignModalOpen(false)} title={`${editingAssignment ? 'Edit' : 'Add'} Teacher - Period ${selectedPeriod}`} size="lg">
        <Select
          label="Teacher"
          placeholder="Select teacher"
          data={teachers?.map(t => ({ value: t._id, label: t.name })) || []}
          value={assignForm.teacherId}
          onChange={(val) => setAssignForm({ ...assignForm, teacherId: val || '' })}
          searchable
          required
        />
        <Select
          label="Subject"
          placeholder="Select subject"
          data={subjects?.map(s => ({ value: s._id, label: s.name })) || []}
          value={assignForm.subjectId}
          onChange={(val) => setAssignForm({ ...assignForm, subjectId: val || '' })}
          searchable
          required
          mt="md"
        />
        
        <Divider label="Select Days" my="md" />
        
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="xs" mb="md">
          {DAY_PRESETS.map(preset => (
            <Button
              key={preset.label}
              size="xs"
              variant={assignForm.days.length === preset.value.length && assignForm.days.every(d => preset.value.includes(d)) ? "filled" : "outline"}
              onClick={() => setAssignForm({ 
                ...assignForm, 
                days: preset.value, 
                allDays: preset.value.length === 5 
              })}
            >
              {preset.icon} {preset.label}
            </Button>
          ))}
        </SimpleGrid>

        <Checkbox
          label="All Days (Monday to Friday)"
          checked={assignForm.allDays}
          onChange={(e) => setAssignForm({ 
            ...assignForm, 
            allDays: e.currentTarget.checked, 
            days: e.currentTarget.checked ? ['M', 'T', 'W', 'Th', 'F'] : [] 
          })}
          mt="md"
        />
        
        {!assignForm.allDays && (
          <MultiSelect
            label="Or Select Specific Days"
            placeholder="Select days"
            data={DAY_OPTIONS}
            value={assignForm.days}
            onChange={(val) => setAssignForm({ ...assignForm, days: val })}
            mt="md"
            required
          />
        )}
        
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setAssignModalOpen(false)}>Cancel</Button>
          <Button onClick={() => assignMutation.mutate()} disabled={!assignForm.teacherId || (!assignForm.allDays && assignForm.days.length === 0)}>
            {editingAssignment ? 'Update Assignment' : 'Assign Teacher'}
          </Button>
        </Group>
      </Modal>

      {/* End Assignment Modal with Reason */}
      <Modal opened={endModalOpen} onClose={() => setEndModalOpen(false)} title="End Teacher Assignment" size="md">
        <Text size="sm" mb="md">
          Are you sure you want to end the assignment for <strong>{endingAssignment?.teacherName}</strong> in Period {endingAssignment?.period}?
        </Text>
        <Textarea
          label="Reason for leaving/changing"
          placeholder="e.g., Resigned, Transferred, Schedule change, etc."
          value={endReason}
          onChange={(e) => setEndReason(e.currentTarget.value)}
          minRows={3}
          autosize
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setEndModalOpen(false)}>Cancel</Button>
          <Button color="red" onClick={() => endMutation.mutate()}>End Assignment</Button>
        </Group>
      </Modal>

      {/* History Modal */}
      <Modal opened={historyModalOpen} onClose={() => setHistoryModalOpen(false)} title={`Period ${selectedPeriod} - Assignment History`} size="lg">
        {periodHistory.length === 0 ? (
          <Text c="dimmed" ta="center">No history for this period.</Text>
        ) : (
          <Table striped>
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Subject</th>
                <th>Days</th>
                <th>Assigned Date</th>
                <th>End Date</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {periodHistory.map((history, idx) => {
                // Safely extract teacher name from history
                let teacherName = 'Unknown';
                if (history.teacherId) {
                  if (typeof history.teacherId === 'object') {
                    teacherName = history.teacherId.name || 'Unknown';
                  } else if (typeof history.teacherId === 'string') {
                    const teacher = teachers?.find(t => t._id === history.teacherId);
                    teacherName = teacher?.name || 'Unknown';
                  }
                }
                
                // Safely extract subject name from history
                let subjectName = 'Unknown';
                if (history.subjectId) {
                  if (typeof history.subjectId === 'object') {
                    subjectName = history.subjectId.name || 'Unknown';
                  } else if (typeof history.subjectId === 'string') {
                    const subject = subjects?.find(s => s._id === history.subjectId);
                    subjectName = subject?.name || 'Unknown';
                  }
                }
                
                return (
                  <tr key={idx}>
                    <td>{teacherName}</td>
                    <td>{subjectName}</td>
                    <td>{history.days?.map((d: string) => DAY_MAP[d]).join(', ') || '—'}</td>
                    <td>{new Date(history.assignedDate).toLocaleDateString()}</td>
                    <td>{history.endDate ? new Date(history.endDate).toLocaleDateString() : 'Current'}</td>
                    <td>{history.reason || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setHistoryModalOpen(false)}>Close</Button>
        </Group>
      </Modal>
    </Stack>
  );
}