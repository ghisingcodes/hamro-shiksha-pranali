import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Select, Button, Table, Group, Title, Stack, Loader, Alert, Badge, 
  Modal, Divider, ActionIcon, Tooltip, Chip, Paper, ScrollArea, Text, 
  Card, ThemeIcon, Box, Grid, Flex,
  Checkbox, Avatar
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconPlus, IconTrash, IconHistory, IconRefresh, IconSchool, 
  IconCalendar, IconClock, IconUser, IconBook, IconCheck, IconX, 
  IconUsers, IconUserCircle, IconCalendarEvent, IconBuilding
} from '@tabler/icons-react';
import { api } from '../lib/api';
import { notifications } from '@mantine/notifications';

const DAY_OPTIONS = [
  { value: 'M', label: 'Mon', full: 'Monday', color: 'blue' },
  { value: 'T', label: 'Tue', full: 'Tuesday', color: 'cyan' },
  { value: 'W', label: 'Wed', full: 'Wednesday', color: 'teal' },
  { value: 'Th', label: 'Thu', full: 'Thursday', color: 'green' },
  { value: 'F', label: 'Fri', full: 'Friday', color: 'orange' },
];

const DAY_PRESETS = [
  { label: 'All Days', value: ['M', 'T', 'W', 'Th', 'F'], icon: '📅', color: 'violet' },
  { label: 'Mon, Wed, Fri', value: ['M', 'W', 'F'], icon: '📆', color: 'indigo' },
  { label: 'Tue, Thu', value: ['T', 'Th'], icon: '📖', color: 'grape' },
];

interface Assignment {
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  days: string[];
  assignedDate: string;
  endDate: string | null;
}

export function ClassRoutinePage() {
  const queryClient = useQueryClient();
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [assignModalOpen, { open: openAssignModal, close: closeAssignModal }] = useDisclosure(false);
  const [historyModalOpen, { open: openHistoryModal, close: closeHistoryModal }] = useDisclosure(false);
  const [assignForm, setAssignForm] = useState({ teacherId: '', subjectId: '', days: [] as string[], allDays: false });
  const [selectedTeacherSubjects, setSelectedTeacherSubjects] = useState<any[]>([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const schoolId = user.schoolId;

  // Fetch data with school headers
  const { data: seasons = [] } = useQuery({ 
    queryKey: ['seasons', schoolId], 
    queryFn: () => api.get('/academic-seasons', { headers: { 'X-School-Id': schoolId } }).then(res => res.data),
    enabled: !!schoolId,
  });
  
  const { data: classes = [] } = useQuery({ 
    queryKey: ['classes', schoolId], 
    queryFn: () => api.get('/classes', { headers: { 'X-School-Id': schoolId } }).then(res => res.data),
    enabled: !!schoolId,
  });
  
  const { data: teachers = [] } = useQuery({ 
    queryKey: ['teachers', schoolId], 
    queryFn: () => api.get('/teachers', { headers: { 'X-School-Id': schoolId } }).then(res => res.data),
    enabled: !!schoolId,
  });
  
  // Fetch subjects for the selected class (for subject dropdown)
  const { data: classSubjects = [] } = useQuery({ 
    queryKey: ['subjects', selectedSeasonId, selectedClassId, schoolId], 
    queryFn: () => api.get('/subjects', { 
      params: { seasonId: selectedSeasonId, classId: selectedClassId },
      headers: { 'X-School-Id': schoolId } 
    }).then(res => res.data || []),
    enabled: !!selectedSeasonId && !!selectedClassId && !!schoolId,
  });

  const { data: sections = [], isLoading, refetch } = useQuery({
    queryKey: ['sections', selectedSeasonId, selectedClassId, schoolId],
    queryFn: () => api.get('/sections', { 
      params: { seasonId: selectedSeasonId, classId: selectedClassId },
      headers: { 'X-School-Id': schoolId } 
    }).then(res => res.data || []),
    enabled: !!selectedSeasonId && !!selectedClassId && !!schoolId,
  });

  // Find current section
  const currentSection = sections?.find((s: any) => s.name === selectedSection);
  const periodCount = classes?.find((c: any) => c._id === selectedClassId)?.periodCount || 7;

  // Get class teacher info
  const getClassTeacher = () => {
    if (!currentSection?.currentClassTeacherId) return { name: 'Not assigned', subject: 'Not assigned' };
    let teacherId = currentSection.currentClassTeacherId;
    let subjectId = currentSection.currentClassTeacherSubjectId;
    if (typeof teacherId === 'object') teacherId = teacherId._id;
    if (typeof subjectId === 'object') subjectId = subjectId._id;
    const teacher = teachers?.find((t: any) => t._id === teacherId);
    const subject = classSubjects?.find((s: any) => s._id === subjectId);
    return { name: teacher?.name || 'Not assigned', subject: subject?.name || 'Not assigned' };
  };

  // Get period data - each period has multiple assignments (multiple teachers on different days)
  const getPeriodAssignments = (periodNum: number): Assignment[] => {
    const periodTeachers = currentSection?.periodTeachers || {};
    const periodData = periodTeachers[periodNum];
    if (!periodData || !Array.isArray(periodData)) return [];
    
    return periodData
      .filter((a: any) => !a.endDate) // Only active assignments
      .map((a: any) => {
        let teacherId = a.teacherId;
        let subjectId = a.subjectId;
        if (typeof teacherId === 'object') teacherId = teacherId._id;
        if (typeof subjectId === 'object') subjectId = subjectId._id;
        
        const teacher = teachers?.find((t: any) => t._id === teacherId);
        const subject = classSubjects?.find((s: any) => s._id === subjectId);
        
        return {
          teacherId: a.teacherId,
          teacherName: teacher?.name || 'Unknown',
          subjectId: a.subjectId,
          subjectName: subject?.name || 'Unknown',
          days: a.days,
          assignedDate: a.assignedDate,
          endDate: a.endDate,
        };
      });
  };

  // Get all period history for a period
  const getPeriodHistory = (periodNum: number): Assignment[] => {
    const periodTeachers = currentSection?.periodTeachers || {};
    const periodData = periodTeachers[periodNum];
    if (!periodData || !Array.isArray(periodData)) return [];
    
    return periodData.map((a: any) => {
      let teacherId = a.teacherId;
      let subjectId = a.subjectId;
      if (typeof teacherId === 'object') teacherId = teacherId._id;
      if (typeof subjectId === 'object') subjectId = subjectId._id;
      
      const teacher = teachers?.find((t: any) => t._id === teacherId);
      const subject = classSubjects?.find((s: any) => s._id === subjectId);
      
      return {
        teacherId: a.teacherId,
        teacherName: teacher?.name || 'Unknown',
        subjectId: a.subjectId,
        subjectName: subject?.name || 'Unknown',
        days: a.days,
        assignedDate: a.assignedDate,
        endDate: a.endDate,
      };
    });
  };

  // Handle teacher change
  const handleTeacherChange = (teacherId: string) => {
    setAssignForm({ ...assignForm, teacherId, subjectId: '' });
  };

  // Get available subjects for assignment (class subjects, with safe fallback)
  const getAvailableSubjects = () => {
    if (!classSubjects || classSubjects.length === 0) return [];
    return classSubjects.map((subject: any) => ({ 
      value: subject._id, 
      label: subject.name
    }));
  };

  const applyDayPreset = (days: string[]) => {
    setAssignForm({ ...assignForm, days, allDays: days.length === 5 });
  };

  const toggleDay = (day: string) => {
    const currentDays = [...assignForm.days];
    if (currentDays.includes(day)) {
      setAssignForm({ ...assignForm, days: currentDays.filter(d => d !== day), allDays: false });
    } else {
      setAssignForm({ ...assignForm, days: [...currentDays, day], allDays: false });
    }
  };

  const handleAllDaysChange = (checked: boolean) => {
    if (checked) {
      setAssignForm({ ...assignForm, days: [], allDays: true });
    } else {
      setAssignForm({ ...assignForm, allDays: false });
    }
  };

  // Assign teacher mutation
  const assignTeacherMutation = useMutation({
    mutationFn: async () => {
      const daysToSend = assignForm.allDays ? ['M', 'T', 'W', 'Th', 'F'] : assignForm.days;
      const payload = {
        period: selectedPeriod,
        teacherId: assignForm.teacherId,
        subjectId: assignForm.subjectId,
        days: daysToSend,
        assignedDate: new Date().toISOString(),
      };
      return api.post(`/sections/${currentSection._id}/assign-period-teacher`, payload, {
        headers: { 'X-School-Id': schoolId }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      closeAssignModal();
      notifications.show({ title: 'Success', message: 'Teacher assigned', color: 'green' });
      setAssignForm({ teacherId: '', subjectId: '', days: [], allDays: false });
    },
    onError: (err: any) => {
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Failed to assign', color: 'red' });
    },
  });

  // End assignment mutation
  const endAssignmentMutation = useMutation({
    mutationFn: async ({ period, teacherId }: { period: number; teacherId: string }) => {
      const payload = { period, teacherId, endDate: new Date().toISOString(), reason: 'Assignment ended' };
      return api.post(`/sections/${currentSection._id}/end-period-teacher`, payload, {
        headers: { 'X-School-Id': schoolId }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      notifications.show({ title: 'Success', message: 'Assignment ended', color: 'green' });
    },
    onError: (err: any) => {
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Failed to end assignment', color: 'red' });
    },
  });

  const handleAssign = () => {
    if (!assignForm.teacherId || !assignForm.subjectId || (assignForm.days.length === 0 && !assignForm.allDays)) {
      notifications.show({ title: 'Error', message: 'Please fill all fields', color: 'red' });
      return;
    }
    assignTeacherMutation.mutate();
  };

  const handleEndAssignment = (period: number, assignment: Assignment) => {
    if (confirm(`End assignment for ${assignment.teacherName} (${assignment.subjectName})? This will end the assignment for the selected days.`)) {
      endAssignmentMutation.mutate({ period, teacherId: assignment.teacherId });
    }
  };

  const openHistoryModalForPeriod = (period: number) => {
    setSelectedPeriod(period);
    openHistoryModal();
  };

  if (isLoading) return <Loader />;

  const classTeacherInfo = getClassTeacher();

  return (
    <Stack p="md" gap="lg" style={{ background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header with Black/Blue Text */}
      <Card withBorder shadow="xl" radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
        <Group justify="space-between">
          <Group>
            <ThemeIcon size="xl" radius="xl" variant="light" style={{ background: 'rgba(255,255,255,0.2)', color: '#FFD700' }}>
              <IconSchool size={32} />
            </ThemeIcon>
            <div>
              <Title order={1} style={{ color: '#ffffff', letterSpacing: '-0.5px' }}>Class Routine Management</Title>
              <Text style={{ color: '#E0E7FF', opacity: 0.9 }} size="sm" mt={4}>Assign teachers to each period with specific days</Text>
            </div>
          </Group>
          <Badge size="xl" variant="light" style={{ background: 'rgba(255,255,255,0.2)', fontSize: '14px', padding: '8px 16px', color: '#FFD700' }}>
            ⏱️ {periodCount} Periods
          </Badge>
        </Group>
      </Card>

      {/* Filters */}
      <Paper withBorder shadow="md" p="lg" radius="lg" style={{ background: 'white' }}>
        <Text fw={600} size="sm" mb="md" c="dimmed">📋 SELECT CRITERIA</Text>
        <Grid>
          <Grid.Col span={4}>
            <Select 
              label="Academic Season" 
              placeholder="Select season" 
              data={seasons?.map((s: any) => ({ value: s._id, label: s.name })) || []} 
              value={selectedSeasonId} 
              onChange={(val) => { setSelectedSeasonId(val || ''); setSelectedClassId(''); setSelectedSection(''); }} 
              leftSection={<IconCalendar size={16} />} 
              radius="md"
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select 
              label="Class" 
              placeholder="Select class" 
              data={classes?.map((c: any) => ({ value: c._id, label: c.displayName })) || []} 
              value={selectedClassId} 
              onChange={(val) => { setSelectedClassId(val || ''); setSelectedSection(''); }} 
              disabled={!selectedSeasonId} 
              leftSection={<IconBook size={16} />} 
              radius="md"
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select 
              label="Section" 
              placeholder="Select section" 
              data={sections?.map((s: any) => ({ value: s.name, label: s.name })) || []} 
              value={selectedSection} 
              onChange={setSelectedSection} 
              disabled={!selectedClassId} 
              leftSection={<IconUsers size={16} />} 
              radius="md"
            />
          </Grid.Col>
        </Grid>
        <Flex justify="flex-end" mt="md">
          <Button variant="light" onClick={() => refetch()} leftSection={<IconRefresh size={16} />} radius="md">
            Refresh Data
          </Button>
        </Flex>
      </Paper>

      {/* Routine Table */}
      {currentSection && (
        <Card withBorder shadow="md" radius="lg" p="lg" style={{ background: 'white' }}>
          <Group justify="space-between" mb="lg">
            <Group>
              <ThemeIcon size="md" color="blue" variant="light" radius="xl">
                <IconUsers size={18} />
              </ThemeIcon>
              <Title order={3} style={{ color: '#2c3e50' }}>Section {selectedSection}</Title>
            </Group>
            <Card withBorder radius="xl" p="xs" style={{ background: 'linear-gradient(135deg, #1e3c7215 0%, #2a529815 100%)' }}>
              <Group gap="xs">
                <Avatar size="sm" color="blue" radius="xl">
                  <IconUserCircle size={14} />
                </Avatar>
                <div>
                  <Text size="xs" c="dimmed">Class Teacher</Text>
                  <Text size="sm" fw={600}>{classTeacherInfo.name}</Text>
                  <Text size="xs" c="dimmed">{classTeacherInfo.subject}</Text>
                </div>
              </Group>
            </Card>
          </Group>

          <div style={{ overflowX: 'auto' }}>
            <Table striped highlightOnHover style={{ borderRadius: '12px' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '16px', fontWeight: 600, color: '#2c3e50', width: '100px' }}>Period</th>
                  <th style={{ padding: '16px', fontWeight: 600, color: '#2c3e50' }}>Teacher & Subject</th>
                  <th style={{ padding: '16px', fontWeight: 600, color: '#2c3e50', width: '180px' }}>Days</th>
                  <th style={{ padding: '16px', fontWeight: 600, color: '#2c3e50', width: '140px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: periodCount }).map((_, idx) => {
                  const periodNum = idx + 1;
                  const assignments = getPeriodAssignments(periodNum);
                  const isClassTeacher = periodNum === 1;
                  
                  return (
                    <tr key={periodNum} style={isClassTeacher && assignments.length > 0 ? { background: 'linear-gradient(90deg, #f0f4ff 0%, #ffffff 100%)' } : {}}>
                      <td style={{ verticalAlign: 'top', padding: '16px' }}>
                        <Group>
                          <ThemeIcon size="md" color={isClassTeacher ? 'blue' : 'gray'} variant="light" radius="xl">
                            <IconClock size={16} />
                          </ThemeIcon>
                          <Text fw={700} size="lg" c={isClassTeacher ? 'blue' : 'dark'}>{periodNum}</Text>
                          {isClassTeacher && assignments.length > 0 && (
                            <Badge size="sm" color="blue" variant="light" radius="xl">Class Teacher</Badge>
                          )}
                        </Group>
                      </td>
                      <td style={{ verticalAlign: 'top', padding: '16px' }}>
                        {assignments.length > 0 ? (
                          <Stack gap="sm">
                            {assignments.map((assignment, idx) => (
                              <Paper key={idx} withBorder p="sm" radius="md" style={{ background: '#fafbfc', borderLeft: `4px solid #2a5298` }}>
                                <Group justify="space-between" wrap="nowrap">
                                  <Group gap="sm">
                                    <Avatar size="sm" color="teal" radius="xl">
                                      <IconUser size={14} />
                                    </Avatar>
                                    <div>
                                      <Text size="sm" fw={600}>{assignment.teacherName}</Text>
                                      <Badge size="xs" variant="light" color="violet" radius="xl">
                                        {assignment.subjectName}
                                      </Badge>
                                    </div>
                                  </Group>
                                  <Tooltip label="End Assignment">
                                    <ActionIcon size="sm" color="red" variant="subtle" onClick={() => handleEndAssignment(periodNum, assignment)}>
                                      <IconTrash size={16} />
                                    </ActionIcon>
                                  </Tooltip>
                                </Group>
                              </Paper>
                            ))}
                          </Stack>
                        ) : (
                          <Text c="dimmed" size="sm" fs="italic">No teacher assigned</Text>
                        )}
                      </td>
                      <td style={{ verticalAlign: 'top', padding: '16px' }}>
                        {assignments.length > 0 ? (
                          <Stack gap="xs">
                            {assignments.map((assignment, idx) => (
                              <Group key={idx} gap="xs">
                                {assignment.days.map(day => {
                                  const dayInfo = DAY_OPTIONS.find(d => d.value === day);
                                  return (
                                    <Badge key={day} size="sm" variant="light" color={dayInfo?.color || 'gray'} radius="xl">
                                      {day}
                                    </Badge>
                                  );
                                })}
                              </Group>
                            ))}
                          </Stack>
                        ) : (
                          <Text c="dimmed" size="sm" fs="italic">—</Text>
                        )}
                      </td>
                      <td style={{ verticalAlign: 'top', padding: '16px' }}>
                        <Group gap="xs">
                          <Button 
                            size="xs" 
                            variant="light" 
                            color="blue" 
                            radius="xl"
                            leftSection={<IconPlus size={14} />}
                            onClick={() => { setSelectedPeriod(periodNum); setAssignForm({ teacherId: '', subjectId: '', days: [], allDays: false }); openAssignModal(); }}
                          >
                            Assign
                          </Button>
                          <Tooltip label="View History">
                            <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => openHistoryModalForPeriod(periodNum)}>
                              <IconHistory size={18} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      {selectedClassId && selectedSection && !currentSection && (
        <Alert color="yellow" variant="light" radius="md">No routine data found for this class and section.</Alert>
      )}

      {/* Assign Teacher Modal */}
      <Modal opened={assignModalOpen} onClose={closeAssignModal} title={`Assign Teacher to Period ${selectedPeriod}`} size="md" centered radius="lg">
        <Stack>
          <Select 
            label="Teacher" 
            placeholder="Select teacher" 
            data={teachers?.map((t: any) => ({ value: t._id, label: `${t.name} - ${t.subjects?.join(', ') || 'No subjects'}` })) || []} 
            value={assignForm.teacherId} 
            onChange={handleTeacherChange} 
            searchable 
            required 
            leftSection={<IconUser size={16} />} 
            radius="md"
          />
          
          <Select 
            label="Subject" 
            placeholder={assignForm.teacherId ? "Select subject" : "First select a teacher"} 
            data={getAvailableSubjects()} 
            value={assignForm.subjectId} 
            onChange={(val) => setAssignForm({ ...assignForm, subjectId: val || '' })} 
            disabled={!assignForm.teacherId} 
            required 
            searchable 
            leftSection={<IconBook size={16} />} 
            radius="md"
          />
          
          <Divider label="Select Days" labelPosition="center" />
          
          <Group justify="center" gap="xs">
            {DAY_PRESETS.map(preset => (
              <Button key={preset.label} size="xs" variant="outline" color={preset.color} onClick={() => applyDayPreset(preset.value)} radius="xl">
                {preset.icon} {preset.label}
              </Button>
            ))}
          </Group>
          
          <Checkbox 
            label="All Days (Monday to Friday)" 
            checked={assignForm.allDays} 
            onChange={(e) => handleAllDaysChange(e.currentTarget.checked)} 
          />
          
          {!assignForm.allDays && (
            <Flex justify="center" gap="xs" wrap="wrap">
              {DAY_OPTIONS.map(day => (
                <Chip 
                  key={day.value} 
                  checked={assignForm.days.includes(day.value)} 
                  onChange={() => toggleDay(day.value)} 
                  variant="light"
                  color={day.color}
                  radius="xl"
                >
                  {day.full}
                </Chip>
              ))}
            </Flex>
          )}
          
          {assignForm.days.length > 0 && !assignForm.allDays && (
            <Badge size="md" color="green" variant="light" radius="xl" style={{ alignSelf: 'center' }}>
              Selected: {assignForm.days.join(', ')}
            </Badge>
          )}
        </Stack>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeAssignModal} radius="md">Cancel</Button>
          <Button onClick={handleAssign} color="blue" radius="md" disabled={!assignForm.teacherId || !assignForm.subjectId || (assignForm.days.length === 0 && !assignForm.allDays)}>
            Assign Teacher
          </Button>
        </Group>
      </Modal>

      {/* History Modal */}
      <Modal opened={historyModalOpen} onClose={closeHistoryModal} title={`Period ${selectedPeriod} - Assignment History`} size="lg" centered radius="lg">
        <ScrollArea style={{ maxHeight: '500px' }}>
          <Stack>
            {getPeriodHistory(selectedPeriod || 0).map((assignment, idx) => {
              const isCurrent = !assignment.endDate;
              return (
                <Paper key={idx} withBorder p="md" radius="md" style={{ 
                  borderLeft: isCurrent ? '4px solid #40c057' : 'none',
                  background: isCurrent ? '#f0fdf4' : 'white'
                }}>
                  <Group justify="space-between">
                    <div>
                      <Group>
                        <ThemeIcon size="sm" color={isCurrent ? 'green' : 'gray'} variant="light" radius="xl">
                          <IconUser size={14} />
                        </ThemeIcon>
                        <Text fw={600}>{assignment.teacherName}</Text>
                        {isCurrent && <Badge size="sm" color="green" radius="xl">Current</Badge>}
                      </Group>
                      <Text size="sm" c="dimmed" mt="4">📖 {assignment.subjectName}</Text>
                      <Text size="sm" c="dimmed">📅 Days: {assignment.days.join(', ')}</Text>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Text size="xs" c="dimmed">📅 From: {new Date(assignment.assignedDate).toLocaleDateString()}</Text>
                      {assignment.endDate && <Text size="xs" c="red">✅ To: {new Date(assignment.endDate).toLocaleDateString()}</Text>}
                    </div>
                  </Group>
                </Paper>
              );
            })}
            {getPeriodHistory(selectedPeriod || 0).length === 0 && (
              <Text c="dimmed" ta="center">No assignment history for this period.</Text>
            )}
          </Stack>
        </ScrollArea>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeHistoryModal} radius="md">Close</Button>
        </Group>
      </Modal>
    </Stack>
  );
}