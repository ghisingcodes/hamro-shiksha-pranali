import { useState, useEffect } from 'react';
import { Modal, Table, Button, Select, Group, Stack, Alert, ActionIcon, Text, MultiSelect, Badge, Divider, Checkbox, Paper, ThemeIcon, ScrollArea, Tabs } from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IconRefresh, IconUserCheck, IconSchool, IconHistory, IconTrash, IconUserPlus } from '@tabler/icons-react';
import { api } from '../../lib/api';
import { Teacher } from '../../lib/types';

const DAY_OPTIONS = [
  { value: 'M', label: 'Monday' },
  { value: 'T', label: 'Tuesday' },
  { value: 'W', label: 'Wednesday' },
  { value: 'Th', label: 'Thursday' },
  { value: 'F', label: 'Friday' },
];

const ALL_DAYS = ['M', 'T', 'W', 'Th', 'F'];
const DAY_PRESETS = [
  { label: 'All Days', value: ALL_DAYS },
  { label: 'Mon, Wed, Fri', value: ['M', 'W', 'F'] },
  { label: 'Tue, Thu', value: ['T', 'Th'] },
];

interface SectionRoutineEditorProps {
  opened: boolean;
  onClose: () => void;
  sectionId: string;
  periodCount: number;
  sectionName: string;
  onRoutineUpdated: () => void;
}

export function SectionRoutineEditor({
  opened,
  onClose,
  sectionId,
  periodCount,
  sectionName,
  onRoutineUpdated,
}: SectionRoutineEditorProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string | null>('periods');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [assignForm, setAssignForm] = useState({
    teacherId: '',
    subject: '',
    days: [] as string[],
    allDays: false,
  });
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [classTeacherForm, setClassTeacherForm] = useState({ teacherId: '', subject: '' });

  const { data: teachers, refetch: refetchTeachers } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then(res => res.data),
  });

  const { data: section, refetch: refetchSection } = useQuery({
    queryKey: ['section', sectionId],
    queryFn: () => api.get(`/sections/${sectionId}`).then(res => res.data),
    enabled: !!sectionId,
  });

  const selectedTeacher = teachers?.find(t => t._id === assignForm.teacherId);
  
  useEffect(() => {
    if (selectedTeacher && selectedTeacher.subjects) {
      setAvailableSubjects(selectedTeacher.subjects);
      if (assignForm.subject && !selectedTeacher.subjects.includes(assignForm.subject)) {
        setAssignForm(prev => ({ ...prev, subject: '' }));
      }
    } else {
      setAvailableSubjects([]);
    }
  }, [assignForm.teacherId, selectedTeacher]);

  const assignClassTeacherMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/sections/${sectionId}/class-teacher`, {
        teacherId: classTeacherForm.teacherId,
        subject: classTeacherForm.subject,
        assignedDate: new Date(),
      });
    },
    onSuccess: () => {
      refetchSection();
      onRoutineUpdated();
      setClassTeacherForm({ teacherId: '', subject: '' });
    },
  });

  const endClassTeacherMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/sections/${sectionId}/class-teacher/end`, {
        endDate: new Date(),
        reason: 'Teacher left',
      });
    },
    onSuccess: () => {
      refetchSection();
      onRoutineUpdated();
    },
  });

  const assignPeriodTeacherMutation = useMutation({
    mutationFn: async () => {
      const daysToSend = assignForm.allDays ? ALL_DAYS : assignForm.days;
      return api.post(`/sections/${sectionId}/period-teacher`, {
        period: selectedPeriod,
        teacherId: assignForm.teacherId,
        subject: assignForm.subject,
        days: daysToSend,
        assignedDate: new Date(),
      });
    },
    onSuccess: () => {
      refetchSection();
      onRoutineUpdated();
      setAssignModalOpen(false);
      setAssignForm({ teacherId: '', subject: '', days: [], allDays: false });
    },
    onError: (err: any) => {
      console.error('Assignment error:', err.response?.data);
      alert(err.response?.data?.message || 'Failed to assign teacher');
    },
  });

  const endPeriodTeacherMutation = useMutation({
    mutationFn: async ({ period, teacherId }: { period: number; teacherId: string }) => {
      return api.post(`/sections/${sectionId}/period-teacher/end`, {
        period,
        teacherId,
        endDate: new Date(),
        reason: 'Assignment ended',
      });
    },
    onSuccess: () => {
      refetchSection();
      onRoutineUpdated();
    },
  });

  const handleAssignClassTeacher = () => {
    if (!classTeacherForm.teacherId || !classTeacherForm.subject) {
      alert('Please select teacher and subject');
      return;
    }
    assignClassTeacherMutation.mutate();
  };

  const handleEndClassTeacher = () => {
    if (confirm('End current class teacher assignment? A new teacher can be assigned later.')) {
      endClassTeacherMutation.mutate();
    }
  };

  const handleAssignPeriodTeacher = () => {
    if (!assignForm.teacherId || !assignForm.subject) {
      alert('Please select a teacher and subject');
      return;
    }
    const daysToCheck = assignForm.allDays ? ALL_DAYS : assignForm.days;
    if (daysToCheck.length === 0) {
      alert('Please select at least one day');
      return;
    }
    assignPeriodTeacherMutation.mutate();
  };

  const handleEndPeriodTeacher = (period: number, teacherId: string) => {
    if (confirm('End this teacher\'s assignment? A new teacher can be assigned later.')) {
      endPeriodTeacherMutation.mutate({ period, teacherId });
    }
  };

  const handleAllDaysChange = (checked: boolean) => {
    if (checked) {
      setAssignForm({ ...assignForm, allDays: true, days: [] });
    } else {
      setAssignForm({ ...assignForm, allDays: false });
    }
  };

  const getCurrentAssignment = (period: number) => {
    const periodTeachers = section?.periodTeachers;
    if (!periodTeachers) return null;
    const assignments = periodTeachers.get(period?.toString()) || periodTeachers.get(period) || [];
    const activeAssignment = assignments.find((a: any) => !a.endDate);
    if (!activeAssignment) return null;
    const teacher = teachers?.find((t: any) => t._id === activeAssignment.teacherId);
    return { 
      teacher, 
      subject: activeAssignment.subject, 
      days: activeAssignment.days, 
      teacherId: activeAssignment.teacherId 
    };
  };

  const getClassTeacher = () => {
    const currentTeacher = teachers?.find((t: any) => t._id === section?.currentClassTeacherId);
    return {
      teacher: currentTeacher,
      subject: section?.currentClassTeacherSubject,
    };
  };

  const classTeacher = getClassTeacher();
  const currentClassTeacher = classTeacher.teacher?.name || 'Not assigned';
  const currentClassSubject = classTeacher.subject || 'Not assigned';

  if (!section) return null;

  return (
    <Modal opened={opened} onClose={onClose} size="xl" title={`Section ${sectionName} - Routine Editor`} scrollAreaComponent={ScrollArea}>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="class-teacher" leftSection={<IconUserCheck size={16} />}>Class Teacher</Tabs.Tab>
          <Tabs.Tab value="periods" leftSection={<IconSchool size={16} />}>Period Teachers</Tabs.Tab>
          <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>History</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="class-teacher" pt="md">
          <Paper withBorder p="md" radius="md" mb="lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Group justify="space-between" align="center">
              <Group>
                <ThemeIcon size="xl" radius="xl" variant="light" color="white" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <IconUserCheck size={28} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="white" opacity={0.8}>Current Class Teacher</Text>
                  <Text size="xl" fw={700} c="white">{currentClassTeacher}</Text>
                  <Text size="sm" c="white" opacity={0.8}>Subject: {currentClassSubject}</Text>
                </div>
              </Group>
              {section.currentClassTeacherId && (
                <Button size="xs" color="red" variant="light" onClick={handleEndClassTeacher}>End Assignment</Button>
              )}
            </Group>
          </Paper>

          <Alert color="cyan" mb="md" variant="light">
            <Group><IconUserPlus size={18} /><Text size="sm">Assign a new class teacher. The previous teacher's record will be kept in history.</Text></Group>
          </Alert>

          <Select
            label="Teacher"
            placeholder="Select teacher"
            data={teachers?.map((t: any) => ({ value: t._id, label: t.name })) || []}
            value={classTeacherForm.teacherId}
            onChange={(val) => setClassTeacherForm({ ...classTeacherForm, teacherId: val || '' })}
            searchable
            required
          />
          <Select
            label="Subject"
            placeholder="Select subject"
            data={teachers?.find(t => t._id === classTeacherForm.teacherId)?.subjects.map((s: string) => ({ value: s, label: s })) || []}
            value={classTeacherForm.subject}
            onChange={(val) => setClassTeacherForm({ ...classTeacherForm, subject: val || '' })}
            disabled={!classTeacherForm.teacherId}
            searchable
            required
            mt="md"
          />
          <Button onClick={handleAssignClassTeacher} loading={assignClassTeacherMutation.isPending} mt="md" fullWidth>
            Assign as Class Teacher
          </Button>
        </Tabs.Panel>

        <Tabs.Panel value="periods" pt="md">
          <Alert color="cyan" mb="md" variant="light">
            <Group><IconSchool size={18} /><Text size="sm">Assign teachers to each period. Teachers can be assigned to specific days.</Text></Group>
          </Alert>

          <ScrollArea style={{ maxHeight: 400 }}>
            <Table striped highlightOnHover>
              <thead><tr><th>Period</th><th>Subject</th><th>Teacher</th><th>Days</th><th>Actions</th></tr></thead>
              <tbody>
                {Array.from({ length: periodCount }).map((_, idx) => {
                  const period = idx + 1;
                  const assignment = getCurrentAssignment(period);
                  const displayDays = assignment?.days?.length === 5 ? 'All days' : assignment?.days?.join(', ') || '—';
                  return (
                    <tr key={period}>
                      <td><Text fw={600}>Period {period}</Text></td>
                      <td>{assignment?.subject || '—'}</td>
                      <td>{assignment?.teacher?.name || '—'}</td>
                      <td>{displayDays}</td>
                      <td>
                        <Button size="xs" variant="light" onClick={() => {
                          const days = assignment?.days || [];
                          setSelectedPeriod(period);
                          setAssignForm({
                            teacherId: assignment?.teacherId || '',
                            subject: assignment?.subject || '',
                            days: days.length === 5 ? [] : days,
                            allDays: days.length === 5,
                          });
                          setAssignModalOpen(true);
                        }}>
                          {assignment ? 'Change' : 'Assign'}
                        </Button>
                        {assignment && (
                          <Button size="xs" variant="subtle" color="red" ml="xs" onClick={() => handleEndPeriodTeacher(period, assignment.teacherId)}>
                            End
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </ScrollArea>
        </Tabs.Panel>

        <Tabs.Panel value="history" pt="md">
          <Tabs defaultValue="class-teacher-history">
            <Tabs.List>
              <Tabs.Tab value="class-teacher-history">Class Teacher History</Tabs.Tab>
              <Tabs.Tab value="period-teacher-history">Period Teacher History</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="class-teacher-history" pt="md">
              <ScrollArea style={{ maxHeight: 400 }}>
                <Table striped highlightOnHover>
                  <thead><tr><th>Teacher</th><th>Subject</th><th>Assigned Date</th><th>End Date</th><th>Reason</th></tr></thead>
                  <tbody>
                    {section.classTeacherHistory?.map((history: any, idx: number) => {
                      const teacher = teachers?.find((t: any) => t._id === history.teacherId);
                      return (
                        <tr key={idx}>
                          <td>{teacher?.name || 'Unknown'}</td>
                          <td>{history.subject}</td>
                          <td>{new Date(history.assignedDate).toLocaleDateString()}</td>
                          <td>{history.endDate ? new Date(history.endDate).toLocaleDateString() : 'Current'}</td>
                          <td>{history.reason || '—'}</td>
                        </tr>
                      );
                    })}
                    {(!section.classTeacherHistory || section.classTeacherHistory.length === 0) && (
                      <tr><td colSpan={5} style={{ textAlign: 'center' }}>No class teacher history</td></tr>
                    )}
                  </tbody>
                </Table>
              </ScrollArea>
            </Tabs.Panel>

            <Tabs.Panel value="period-teacher-history" pt="md">
              <Select
                label="Select Period"
                placeholder="Choose period"
                data={Array.from({ length: periodCount }, (_, i) => ({ value: (i + 1).toString(), label: `Period ${i + 1}` }))}
                value={selectedPeriod?.toString()}
                onChange={(val) => setSelectedPeriod(val ? parseInt(val) : null)}
                mb="md"
              />
              {selectedPeriod && (
                <ScrollArea style={{ maxHeight: 400 }}>
                  <Table striped highlightOnHover>
                    <thead><tr><th>Teacher</th><th>Subject</th><th>Days</th><th>Assigned Date</th><th>End Date</th><th>Reason</th></tr></thead>
                    <tbody>
                      {(section.periodTeachers?.get(selectedPeriod.toString()) || section.periodTeachers?.get(selectedPeriod) || []).map((assignment: any, idx: number) => {
                        const teacher = teachers?.find((t: any) => t._id === assignment.teacherId);
                        return (
                          <tr key={idx}>
                            <td>{teacher?.name || 'Unknown'}</td>
                            <td>{assignment.subject}</td>
                            <td>{assignment.days.join(', ')}</td>
                            <td>{new Date(assignment.assignedDate).toLocaleDateString()}</td>
                            <td>{assignment.endDate ? new Date(assignment.endDate).toLocaleDateString() : 'Current'}</td>
                            <td>{assignment.reason || '—'}</td>
                          </td>
                        );
                      })}
                      {(!section.periodTeachers?.get(selectedPeriod.toString()) || section.periodTeachers?.get(selectedPeriod).length === 0) && (
                        <tr><td colSpan={6} style={{ textAlign: 'center' }}>No history for this period</td></tr>
                      )}
                    </tbody>
                  </Table>
                </ScrollArea>
              )}
            </Tabs.Panel>
          </Tabs>
        </Tabs.Panel>
      </Tabs>

      {/* Assignment Modal for Period Teachers */}
      <Modal opened={assignModalOpen} onClose={() => setAssignModalOpen(false)} title={`Assign Teacher to Period ${selectedPeriod}`} size="md">
        <Select
          label="Teacher"
          placeholder="Select teacher"
          data={teachers?.map((t: any) => ({ value: t._id, label: t.name })) || []}
          value={assignForm.teacherId}
          onChange={(val) => { setAssignForm({ ...assignForm, teacherId: val || '', subject: '' }); }}
          searchable
          required
        />
        <Select
          label="Subject"
          placeholder={assignForm.teacherId ? "Select subject" : "First select a teacher"}
          data={availableSubjects.map(s => ({ value: s, label: s }))}
          value={assignForm.subject}
          onChange={(val) => setAssignForm({ ...assignForm, subject: val || '' })}
          disabled={!assignForm.teacherId}
          searchable
          required
          mt="md"
        />
        <Divider label="Days" labelPosition="center" my="md" />
        <Group justify="center" gap="xs">
          {DAY_PRESETS.map(preset => (
            <Button key={preset.label} size="xs" variant="outline" onClick={() => setAssignForm({ ...assignForm, days: preset.value, allDays: preset.value.length === 5 })}>
              {preset.label}
            </Button>
          ))}
        </Group>
        <Checkbox
          label="All Days (Monday to Friday)"
          checked={assignForm.allDays}
          onChange={(e) => handleAllDaysChange(e.currentTarget.checked)}
          mb="md"
          mt="md"
        />
        {!assignForm.allDays && (
          <MultiSelect
            label="Select Specific Days"
            placeholder="Select days"
            data={DAY_OPTIONS}
            value={assignForm.days}
            onChange={(val) => setAssignForm({ ...assignForm, days: val })}
            required
          />
        )}
        {assignForm.days.length > 0 && !assignForm.allDays && (
          <Badge size="md" color="green" variant="light" mt="sm">Selected: {assignForm.days.join(', ')}</Badge>
        )}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setAssignModalOpen(false)}>Cancel</Button>
          <Button onClick={handleAssignPeriodTeacher} loading={assignPeriodTeacherMutation.isPending} color="blue">
            Assign Teacher
          </Button>
        </Group>
      </Modal>

      <Group justify="flex-end" mt="md">
        <ActionIcon onClick={() => refetchTeachers()} variant="subtle">
          <IconRefresh size={16} />
        </ActionIcon>
      </Group>
    </Modal>
  );
}