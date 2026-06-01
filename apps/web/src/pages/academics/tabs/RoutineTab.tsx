import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Select, Button, Group, Title, Stack, Loader, Alert, Badge, 
  Table, ActionIcon, Tooltip, Modal, TextInput, 
  MultiSelect, Divider, Checkbox, Paper, Text
} from '@mantine/core';
import { IconHistory, IconRefresh } from '@tabler/icons-react';
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
  { label: 'All Days', value: ['M', 'T', 'W', 'Th', 'F'] },
  { label: 'Mon, Wed, Fri', value: ['M', 'W', 'F'] },
  { label: 'Tue, Thu', value: ['T', 'Th'] },
];

export function RoutineTab() {
  const queryClient = useQueryClient();
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
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

  // Fetch subjects filtered by season AND class
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

  // Assign teacher mutation
  const assignMutation = useMutation({
    mutationFn: async () => {
      const daysToSend = assignForm.allDays ? ['M', 'T', 'W', 'Th', 'F'] : assignForm.days;
      return api.post(`/sections/${selectedSectionId}/assign-period-teacher`, {
        period: selectedPeriod,
        teacherId: assignForm.teacherId,
        subjectId: assignForm.subjectId,
        days: daysToSend,
        assignedDate: new Date(),
      }, { 
        headers: { 'X-School-Id': schoolId } 
      });
    },
    onSuccess: () => {
      refetchSection();
      setAssignModalOpen(false);
      setAssignForm({ teacherId: '', subjectId: '', days: [], allDays: false });
      notifications.show({ title: 'Success', message: 'Teacher assigned', color: 'green' });
    },
    onError: (err: any) => {
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Failed to assign', color: 'red' });
    },
  });

  // End assignment mutation
  const endMutation = useMutation({
    mutationFn: async ({ period, teacherId }: { period: number; teacherId: string }) => {
      return api.post(`/sections/${selectedSectionId}/end-period-teacher`, {
        period,
        teacherId,
        endDate: new Date(),
      }, { 
        headers: { 'X-School-Id': schoolId } 
      });
    },
    onSuccess: () => {
      refetchSection();
      notifications.show({ title: 'Success', message: 'Assignment ended', color: 'green' });
    },
  });

  // Get current assignment for a period
  const getAssignment = (period: number) => {
    const periodTeachers = section?.periodTeachers;
    if (!periodTeachers) return null;
    const assignments = periodTeachers[period] || [];
    const active = assignments.find((a: any) => !a.endDate);
    if (!active) return null;
    const teacher = teachers?.find(t => t._id === active.teacherId);
    const subject = subjects?.find(s => s._id === active.subjectId);
    return { teacher, subject, days: active.days, teacherId: active.teacherId, subjectId: active.subjectId };
  };

  // Get history for a period
  const getPeriodHistory = (period: number) => {
    const periodTeachers = section?.periodTeachers;
    if (!periodTeachers) return [];
    return periodTeachers[period] || [];
  };

  // Get class teacher info
  const classTeacher = {
    teacher: teachers?.find(t => t._id === section?.currentClassTeacherId)?.name || 'Not assigned',
    subject: subjects?.find(s => s._id === section?.currentClassTeacherSubjectId)?.name || 'Not assigned',
  };

  const handleViewHistory = (period: number) => {
    setSelectedPeriod(period);
    setPeriodHistory(getPeriodHistory(period));
    setHistoryModalOpen(true);
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

  // Refresh data when dependencies change
  const handleRefresh = () => {
    if (selectedSectionId) refetchSection();
    if (selectedClassId && selectedSeasonId) refetchSections();
  };

  return (
    <Stack>
      <Group grow>
        <Select
          label="Academic Season"
          placeholder="Select season"
          data={seasons?.map(s => ({ value: s._id, label: s.name })) || []}
          value={selectedSeasonId}
          onChange={handleSeasonChange}
        />
        <Select
          label="Class"
          placeholder="Select class"
          data={classes?.map(c => ({ value: c._id, label: c.displayName })) || []}
          value={selectedClassId}
          onChange={handleClassChange}
          disabled={!selectedSeasonId}
        />
        <Select
          label="Section"
          placeholder="Select section"
          data={sections?.map(s => ({ value: s._id, label: s.name })) || []}
          value={selectedSectionId}
          onChange={handleSectionChange}
          disabled={!selectedClassId}
        />
        <Button 
          variant="subtle" 
          onClick={handleRefresh} 
          disabled={!selectedSectionId}
          leftSection={<IconRefresh size={16} />}
        >
          Refresh
        </Button>
      </Group>

      {selectedSectionId && section && (
        <>
          <Alert color="blue" variant="light">
            <Group justify="space-between">
              <div>
                <Text fw={600}>Class Teacher:</Text>
                <Text>{classTeacher.teacher} - {classTeacher.subject}</Text>
              </div>
              <Badge size="lg">Periods: {periodCount}</Badge>
            </Group>
          </Alert>

          <div style={{ overflowX: 'auto' }}>
            <Table striped highlightOnHover>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Subject</th>
                  <th>Teacher</th>
                  <th>Days</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: periodCount }).map((_, idx) => {
                  const period = idx + 1;
                  const assignment = getAssignment(period);
                  return (
                    <tr key={period}>
                      <td style={{ fontWeight: 'bold' }}>Period {period}</td>
                      <td>{assignment?.subject?.name || '—'}</td>
                      <td>{assignment?.teacher?.name || '—'}</td>
                      <td>{assignment?.days?.join(', ') || '—'}</td>
                      <td>
                        <Group gap="xs">
                          <Button
                            size="xs"
                            variant="light"
                            onClick={() => {
                              setSelectedPeriod(period);
                              setAssignForm({
                                teacherId: assignment?.teacherId || '',
                                subjectId: assignment?.subjectId || '',
                                days: assignment?.days || [],
                                allDays: assignment?.days?.length === 5,
                              });
                              setAssignModalOpen(true);
                            }}
                          >
                            {assignment ? 'Change' : 'Assign'}
                          </Button>
                          {assignment && (
                            <Button
                              size="xs"
                              variant="subtle"
                              color="red"
                              onClick={() => endMutation.mutate({ period, teacherId: assignment.teacherId })}
                            >
                              End
                            </Button>
                          )}
                          <Tooltip label="History">
                            <ActionIcon size="sm" onClick={() => handleViewHistory(period)}>
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
        </>
      )}

      {selectedClassId && selectedSeasonId && !selectedSectionId && (
        <Alert color="blue" variant="light">
          Please select a section to view and manage routine.
        </Alert>
      )}

      {!selectedClassId && selectedSeasonId && (
        <Alert color="blue" variant="light">
          Please select a class to continue.
        </Alert>
      )}

      {!selectedSeasonId && (
        <Alert color="blue" variant="light">
          Please select an academic season first.
        </Alert>
      )}

      {/* Assign Teacher Modal */}
      <Modal
        opened={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign Teacher - Period ${selectedPeriod}`}
        size="md"
      >
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
          disabled={!assignForm.teacherId}
          searchable
          required
          mt="md"
        />
        {subjects?.length === 0 && assignForm.teacherId && (
          <Alert color="yellow" mt="md" size="xs">
            No subjects found for this class. Please add subjects in the Subjects tab first.
          </Alert>
        )}
        <Divider label="Days" my="md" />
        <Group justify="center" gap="xs">
          {DAY_PRESETS.map(preset => (
            <Button
              key={preset.label}
              size="xs"
              variant="outline"
              onClick={() => setAssignForm({ 
                ...assignForm, 
                days: preset.value, 
                allDays: preset.value.length === 5 
              })}
            >
              {preset.label}
            </Button>
          ))}
        </Group>
        <Checkbox
          label="All Days (Monday to Friday)"
          checked={assignForm.allDays}
          onChange={(e) => setAssignForm({ 
            ...assignForm, 
            allDays: e.currentTarget.checked, 
            days: [] 
          })}
          mt="md"
        />
        {!assignForm.allDays && (
          <MultiSelect
            label="Select Specific Days"
            placeholder="Select days"
            data={DAY_OPTIONS}
            value={assignForm.days}
            onChange={(val) => setAssignForm({ ...assignForm, days: val })}
            mt="md"
            required
          />
        )}
        <Group justify="flex-end" mt="md">
          <Button 
            onClick={() => assignMutation.mutate()} 
            disabled={!assignForm.teacherId || (!assignForm.allDays && assignForm.days.length === 0)}
          >
            Assign Teacher
          </Button>
        </Group>
      </Modal>

      {/* History Modal */}
      <Modal
        opened={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={`Period ${selectedPeriod} - Assignment History`}
        size="lg"
      >
        {periodHistory.length === 0 ? (
          <Text c="dimmed" ta="center">No history for this period.</Text>
        ) : (
          <Table striped highlightOnHover>
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
                const teacher = teachers?.find(t => t._id === history.teacherId);
                const subject = subjects?.find(s => s._id === history.subjectId);
                return (
                  <tr key={idx}>
                    <td>{teacher?.name || 'Unknown'}</td>
                    <td>{subject?.name || 'Unknown'}</td>
                    <td>{history.days?.join(', ') || '—'}</td>
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