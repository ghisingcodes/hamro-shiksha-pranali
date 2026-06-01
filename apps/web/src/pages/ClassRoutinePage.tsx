import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Select, Button, Table, Group, Title, Stack, Loader, Alert, Badge, 
  Modal, Divider, ActionIcon, Tooltip, Chip, Paper, ScrollArea, Text, 
  Card, ThemeIcon, Box, Grid, Flex,
  Checkbox
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconPlus, IconTrash, IconHistory, IconRefresh, IconSchool, 
  IconCalendar, IconClock, IconUser, IconBook, IconCheck, IconX, 
  IconUsers
} from '@tabler/icons-react';
import { api } from '../lib/api';
import { notifications } from '@mantine/notifications';

const DAY_OPTIONS = [
  { value: 'M', label: 'Mon', full: 'Monday' },
  { value: 'T', label: 'Tue', full: 'Tuesday' },
  { value: 'W', label: 'Wed', full: 'Wednesday' },
  { value: 'Th', label: 'Thu', full: 'Thursday' },
  { value: 'F', label: 'Fri', full: 'Friday' },
];

const DAY_PRESETS = [
  { label: 'All Days', value: ['M', 'T', 'W', 'Th', 'F'], icon: '📅' },
  { label: 'Mon, Wed, Fri', value: ['M', 'W', 'F'], icon: '📆' },
  { label: 'Tue, Thu', value: ['T', 'Th'], icon: '📖' },
];

interface Assignment { teacherId: string; teacherName: string; subject: string; days: string[]; assignedDate: string; endDate: string | null; }
interface PeriodData { period: number; subject: string; assignments: Assignment[]; }

export function ClassRoutinePage() {
  const queryClient = useQueryClient();
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [assignModalOpen, { open: openAssignModal, close: closeAssignModal }] = useDisclosure(false);
  const [historyModalOpen, { open: openHistoryModal, close: closeHistoryModal }] = useDisclosure(false);
  const [assignForm, setAssignForm] = useState({ teacherId: '', subject: '', days: [] as string[], allDays: false });
  const [selectedTeacherSubjects, setSelectedTeacherSubjects] = useState<string[]>([]);

  const { data: seasons } = useQuery({ queryKey: ['seasons'], queryFn: () => api.get('/academic-seasons').then(res => res.data) });
  const { data: classes } = useQuery({ queryKey: ['classes'], queryFn: () => api.get('/classes').then(res => res.data) });
  const { data: teachers } = useQuery({ queryKey: ['teachers'], queryFn: () => api.get('/teachers').then(res => res.data) });
  const { data: classSections, isLoading, refetch } = useQuery({
    queryKey: ['classSections', selectedSeasonId, selectedClassId],
    queryFn: () => api.get(`/class-sections?seasonId=${selectedSeasonId}&classId=${selectedClassId}`).then(res => res.data),
    enabled: !!selectedSeasonId && !!selectedClassId,
  });

  const currentCS = classSections?.find((cs: any) => { const csClassId = typeof cs.classId === 'string' ? cs.classId : cs.classId?._id; return csClassId === selectedClassId; });
  const currentSection = currentCS?.sections?.find((s: any) => s.name === selectedSection);
  const periodCount = currentCS?.classId?.periodCount || 7;
  const getSectionIndex = () => { if (!currentCS || !selectedSection) return -1; return currentCS.sections.findIndex((s: any) => s.name === selectedSection); };

  const handleTeacherChange = (teacherId: string) => { const teacher = teachers?.find((t: any) => t._id === teacherId); setSelectedTeacherSubjects(teacher?.subjects || []); setAssignForm({ ...assignForm, teacherId, subject: '' }); };
  const applyDayPreset = (days: string[]) => { setAssignForm({ ...assignForm, days, allDays: days.length === 5 }); };
  const toggleDay = (day: string) => { const currentDays = [...assignForm.days]; if (currentDays.includes(day)) setAssignForm({ ...assignForm, days: currentDays.filter(d => d !== day) }); else setAssignForm({ ...assignForm, days: [...currentDays, day] }); setAssignForm(prev => ({ ...prev, allDays: false })); };
  const handleAllDaysChange = (checked: boolean) => { if (checked) setAssignForm({ ...assignForm, days: [], allDays: true }); else setAssignForm({ ...assignForm, allDays: false }); };

  const assignTeacherMutation = useMutation({
    mutationFn: async () => { const sectionIndex = getSectionIndex(); if (sectionIndex === -1) throw new Error('Section not found'); const daysToSend = assignForm.allDays ? ['M', 'T', 'W', 'Th', 'F'] : assignForm.days; return api.post(`/class-sections/${currentCS._id}/sections/${sectionIndex}/period-teacher`, { period: selectedPeriod, subject: assignForm.subject, teacherId: assignForm.teacherId, days: daysToSend, assignedDate: new Date() }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['classSections'] }); closeAssignModal(); notifications.show({ title: 'Success', message: 'Teacher assigned', color: 'green' }); setAssignForm({ teacherId: '', subject: '', days: [], allDays: false }); },
    onError: (err: any) => { notifications.show({ title: 'Error', message: err.response?.data?.message || 'Failed to assign', color: 'red' }); },
  });

  const endAssignmentMutation = useMutation({
    mutationFn: async ({ period, teacherId }: { period: number; teacherId: string }) => { const sectionIndex = getSectionIndex(); if (sectionIndex === -1) throw new Error('Section not found'); return api.post(`/class-sections/${currentCS._id}/sections/${sectionIndex}/end-assignment`, { period, teacherId, endDate: new Date() }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['classSections'] }); notifications.show({ title: 'Success', message: 'Assignment ended', color: 'green' }); },
  });

  const handleAssign = () => { if (!assignForm.teacherId || !assignForm.subject || (assignForm.days.length === 0 && !assignForm.allDays)) { notifications.show({ title: 'Error', message: 'Please fill all fields', color: 'red' }); return; } assignTeacherMutation.mutate(); };
  const handleEndAssignment = (period: number, assignment: Assignment) => { if (confirm(`End assignment for ${assignment.teacherName} (${assignment.subject})?`)) endAssignmentMutation.mutate({ period, teacherId: assignment.teacherId }); };

  const getPeriodData = (period: number): PeriodData | null => {
    const periodData = currentSection?.periodTeachers?.find((p: any) => p.period === period);
    if (!periodData) return null;
    const activeAssignments = periodData.assignments?.filter((a: any) => !a.endDate) || [];
    const assignments = activeAssignments.map((a: any) => { const teacher = teachers?.find((t: any) => t._id === a.teacherId); return { teacherId: a.teacherId, teacherName: teacher?.name || 'Unknown', subject: periodData.subject, days: a.days, assignedDate: a.assignedDate, endDate: a.endDate }; });
    return { period: periodData.period, subject: periodData.subject, assignments };
  };

  const openHistoryModalForPeriod = (period: number) => { setSelectedPeriod(period); openHistoryModal(); };

  if (isLoading) return <Loader />;

  return (
    <Stack p="md" gap="lg">
      {/* Header */}
      <Card withBorder shadow="sm" radius="lg" p="lg" style={{ background: 'linear-gradient(135deg, #1e5a7a 0%, #0e3a52 100%)' }}>
        <Group justify="space-between">
          <Group>
            <ThemeIcon size="xl" radius="xl" variant="light" color="white" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <IconSchool size={28} />
            </ThemeIcon>
            <div>
              <Title order={1} c="white">Class Routine Management</Title>
              <Text c="white" opacity={0.8} size="sm">Assign teachers to each period with specific days</Text>
            </div>
          </Group>
          <Badge size="lg" variant="light" color="white" style={{ background: 'rgba(255,255,255,0.2)' }}>
            {periodCount} Periods
          </Badge>
        </Group>
      </Card>

      {/* Filters */}
      <Paper withBorder p="md" radius="lg">
        <Grid>
          <Grid.Col span={4}>
            <Select label="Academic Season" placeholder="Select season" data={seasons?.map((s: any) => ({ value: s._id, label: s.name })) || []} value={selectedSeasonId} onChange={(val) => { setSelectedSeasonId(val || ''); setSelectedClassId(''); setSelectedSection(''); }} leftSection={<IconCalendar size={16} />} />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select label="Class" placeholder="Select class" data={classes?.map((c: any) => ({ value: c._id, label: c.displayName })) || []} value={selectedClassId} onChange={(val) => { setSelectedClassId(val || ''); setSelectedSection(''); }} disabled={!selectedSeasonId} leftSection={<IconBook size={16} />} />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select label="Section" placeholder="Select section" data={currentCS?.sections?.map((s: any) => ({ value: s.name, label: s.name })) || []} value={selectedSection} onChange={setSelectedSection} disabled={!selectedClassId} leftSection={<IconUsers size={16} />} />
          </Grid.Col>
        </Grid>
        <Flex justify="flex-end" mt="md">
          <Button variant="light" onClick={() => refetch()} leftSection={<IconRefresh size={16} />}>Refresh</Button>
        </Flex>
      </Paper>

      {/* Routine Table */}
      {currentSection && (
        <Card withBorder shadow="sm" radius="lg" p="lg">
          <Group justify="space-between" mb="md">
            <Group>
              <ThemeIcon size="md" color="blue" variant="light">
                <IconUsers size={16} />
              </ThemeIcon>
              <Title order={3}>Section {selectedSection}</Title>
            </Group>
            <Badge size="lg" color="blue" variant="light">
              👨‍🏫 Class Teacher: {teachers?.find((t: any) => t._id === currentSection.currentClassTeacherId)?.name || 'Not assigned'}
            </Badge>
          </Group>

          <div style={{ overflowX: 'auto' }}>
            <Table striped highlightOnHover>
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Period</th>
                  <th style={{ width: 120 }}>Subject</th>
                  <th>Assigned Teachers</th>
                  <th style={{ width: 150 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: periodCount }).map((_, period) => {
                  const periodData = getPeriodData(period + 1);
                  const periodNum = period + 1;
                  const isClassTeacher = periodNum === 1;
                  return (
                    <tr key={period} style={isClassTeacher && periodData?.subject ? { backgroundColor: '#f0f9ff' } : {}}>
                      <td>
                        <Group>
                          <ThemeIcon size="sm" color={isClassTeacher ? 'blue' : 'gray'} variant="light" radius="xl">
                            <IconClock size={14} />
                          </ThemeIcon>
                          <Text fw={600}>Period {periodNum}</Text>
                          {isClassTeacher && periodData?.subject && <Badge size="xs" color="blue">Class Teacher</Badge>}
                        </Group>
                      </td>
                      <td><Text fw={500}>{periodData?.subject || '—'}</Text></td>
                      <td>
                        {periodData?.assignments.length ? (
                          <Stack gap={6}>
                            {periodData.assignments.map((assignment, idx) => (
                              <Paper key={idx} withBorder p="xs" radius="md" style={{ backgroundColor: '#f8f9fa' }}>
                                <Group justify="space-between" wrap="nowrap">
                                  <Group gap={6}>
                                    <ThemeIcon size="sm" color="teal" variant="light" radius="xl">
                                      <IconUser size={12} />
                                    </ThemeIcon>
                                    <Text size="sm" fw={500}>{assignment.teacherName}</Text>
                                    <Badge size="sm" variant="light" color="gray">
                                      {assignment.days.join(', ')}
                                    </Badge>
                                  </Group>
                                  <Tooltip label="End Assignment">
                                    <ActionIcon size="sm" color="red" variant="subtle" onClick={() => handleEndAssignment(periodNum, assignment)}>
                                      <IconTrash size={14} />
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
                      <td>
                        <Group gap={4}>
                          <Button size="xs" variant="light" color="blue" onClick={() => { setSelectedPeriod(periodNum); setAssignForm({ teacherId: '', subject: '', days: [], allDays: false }); openAssignModal(); }} leftSection={<IconPlus size={14} />}>
                            Assign
                          </Button>
                          <Tooltip label="View History">
                            <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => openHistoryModalForPeriod(periodNum)}>
                              <IconHistory size={16} />
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
        <Alert color="yellow" variant="light">No routine data found for this class and section.</Alert>
      )}

      {/* Assign Teacher Modal */}
      <Modal opened={assignModalOpen} onClose={closeAssignModal} title={`Assign Teacher to Period ${selectedPeriod}`} size="md" centered>
        <Stack>
          <Select label="Teacher" placeholder="Select teacher" data={teachers?.map((t: any) => ({ value: t._id, label: `${t.name} - ${t.subjects?.join(', ') || 'No subjects'}` })) || []} value={assignForm.teacherId} onChange={handleTeacherChange} searchable required leftSection={<IconUser size={16} />} />
          
          <Select label="Subject" placeholder={assignForm.teacherId ? "Select subject" : "First select a teacher"} data={selectedTeacherSubjects.map((s: string) => ({ value: s, label: s }))} value={assignForm.subject} onChange={(val) => setAssignForm({ ...assignForm, subject: val || '' })} disabled={!assignForm.teacherId} required searchable leftSection={<IconBook size={16} />} />
          
          <Divider label="Select Days" labelPosition="center" />
          
          <Group justify="center" gap="xs">
            {DAY_PRESETS.map(preset => (
              <Button key={preset.label} size="xs" variant="outline" onClick={() => applyDayPreset(preset.value)}>
                {preset.label}
              </Button>
            ))}
          </Group>
          
          <Checkbox label="All Days (Monday to Friday)" checked={assignForm.allDays} onChange={(e) => handleAllDaysChange(e.currentTarget.checked)} />
          
          {!assignForm.allDays && (
            <Group justify="center" gap="md">
              {DAY_OPTIONS.map(day => (
                <Chip key={day.value} checked={assignForm.days.includes(day.value)} onChange={() => toggleDay(day.value)} variant="light">
                  {day.full}
                </Chip>
              ))}
            </Group>
          )}
          
          {assignForm.days.length > 0 && !assignForm.allDays && (
            <Badge size="md" color="green" variant="light" style={{ alignSelf: 'center' }}>
              Selected: {assignForm.days.join(', ')}
            </Badge>
          )}
        </Stack>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeAssignModal}>Cancel</Button>
          <Button onClick={handleAssign} color="blue" disabled={!assignForm.teacherId || !assignForm.subject || (assignForm.days.length === 0 && !assignForm.allDays)}>
            Assign Teacher
          </Button>
        </Group>
      </Modal>

      {/* History Modal */}
      <Modal opened={historyModalOpen} onClose={closeHistoryModal} title={`Period ${selectedPeriod} - Assignment History`} size="lg" centered>
        <ScrollArea style={{ maxHeight: '500px' }}>
          <Stack>
            {currentSection?.periodTeachers?.find((p: any) => p.period === selectedPeriod)?.assignments?.map((assignment: any, idx: number) => {
              const teacher = teachers?.find((t: any) => t._id === assignment.teacherId);
              const isCurrent = !assignment.endDate;
              return (
                <Paper key={idx} withBorder p="md" radius="md" style={{ borderLeft: isCurrent ? '4px solid #40c057' : 'none' }}>
                  <Group justify="space-between">
                    <div>
                      <Group>
                        <ThemeIcon size="sm" color={isCurrent ? 'green' : 'gray'} variant="light" radius="xl">
                          <IconUser size={14} />
                        </ThemeIcon>
                        <Text fw={600}>{teacher?.name || 'Unknown'}</Text>
                        {isCurrent && <Badge size="sm" color="green">Current</Badge>}
                      </Group>
                      <Text size="sm" c="dimmed" mt="4">Subject: {assignment.subject}</Text>
                      <Text size="sm" c="dimmed">Days: {assignment.days.join(', ')}</Text>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Text size="xs" c="dimmed">From: {new Date(assignment.assignedDate).toLocaleDateString()}</Text>
                      {assignment.endDate && <Text size="xs" c="red">To: {new Date(assignment.endDate).toLocaleDateString()}</Text>}
                    </div>
                  </Group>
                </Paper>
              );
            })}
            {(!currentSection?.periodTeachers?.find((p: any) => p.period === selectedPeriod)?.assignments?.length) && (
              <Text c="dimmed" ta="center">No assignment history for this period.</Text>
            )}
          </Stack>
        </ScrollArea>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeHistoryModal}>Close</Button>
        </Group>
      </Modal>
    </Stack>
  );
}