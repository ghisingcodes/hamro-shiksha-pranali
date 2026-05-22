import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, Table, Button, Modal, TextInput, Group, Stack, Title, Loader, Alert, Badge, Checkbox, Divider } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { api } from '../lib/api';
import { AcademicSeason, ClassSection, Teacher } from '../lib/types';
import { notifications } from '@mantine/notifications';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function ClassRoutinePage() {
  const queryClient = useQueryClient();
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [editCell, setEditCell] = useState<{ day: number; period: number } | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editTeacher, setEditTeacher] = useState('');
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  // For copying to all days (old feature)
  const [copyPeriod, setCopyPeriod] = useState<number | null>(null);
  const [copyTeacher, setCopyTeacher] = useState('');
  const [copySubject, setCopySubject] = useState('');
  const [copyModalOpened, { open: openCopyModal, close: closeCopyModal }] = useDisclosure(false);

  // For assigning to selected days
  const [assignPeriod, setAssignPeriod] = useState<number | null>(null);
  const [assignTeacher, setAssignTeacher] = useState('');
  const [assignSubject, setAssignSubject] = useState('');
  const [assignDays, setAssignDays] = useState<boolean[]>(Array(5).fill(false));
  const [assignModalOpened, { open: openAssignModal, close: closeAssignModal }] = useDisclosure(false);

  const { data: seasons } = useQuery<AcademicSeason[]>({
    queryKey: ['seasons'],
    queryFn: () => api.get('/academic-seasons').then(res => res.data),
  });

  const { data: teachers = [] } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then(res => res.data),
  });

  const { data: classSections, isLoading, refetch } = useQuery<ClassSection[]>({
    queryKey: ['classSections', selectedSeasonId],
    queryFn: () => api.get(`/class-sections?seasonId=${selectedSeasonId}`).then(res => res.data),
    enabled: !!selectedSeasonId,
  });

  const availableClasses = classSections
    ?.map(cs => ({
      id: cs._id,
      className: (cs.classId as any)?.displayName || 'Unknown',
    }))
    .filter((v, i, a) => a.findIndex(t => t.className === v.className) === i) || [];

  const currentCS = classSections?.find(cs => cs._id === selectedClassId);
  const currentSection = currentCS?.sections[selectedSectionIndex];
  const periodCount = (currentCS?.classId as any)?.periodCount || 7;

  const updateRoutineMutation = useMutation({
    mutationFn: ({ sectionIndex, day, period, subject, teacher }: any) =>
      api.put(`/class-sections/${selectedClassId}/routine`, { sectionIndex, day, period, subject, teacher }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classSections', selectedSeasonId] });
      closeModal();
      notifications.show({ title: 'Success', message: 'Routine updated', color: 'green' });
    },
    onError: (err: any) => {
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Update failed', color: 'red' });
    },
  });

  const copyToAllDaysMutation = useMutation({
    mutationFn: async () => {
      if (copyPeriod === null) return;
      const promises = [];
      for (let day = 0; day < 5; day++) {
        promises.push(
          api.put(`/class-sections/${selectedClassId}/routine`, {
            sectionIndex: selectedSectionIndex,
            day,
            period: copyPeriod,
            subject: copySubject,
            teacher: copyTeacher,
          })
        );
      }
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classSections', selectedSeasonId] });
      closeCopyModal();
      notifications.show({ title: 'Success', message: `Copied to all days of Period ${copyPeriod! + 1}`, color: 'green' });
    },
  });

  const assignToSelectedDaysMutation = useMutation({
    mutationFn: async () => {
      if (assignPeriod === null) return;
      const promises = [];
      for (let day = 0; day < 5; day++) {
        if (assignDays[day]) {
          promises.push(
            api.put(`/class-sections/${selectedClassId}/routine`, {
              sectionIndex: selectedSectionIndex,
              day,
              period: assignPeriod,
              subject: assignSubject,
              teacher: assignTeacher,
            })
          );
        }
      }
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classSections', selectedSeasonId] });
      closeAssignModal();
      notifications.show({ title: 'Success', message: `Assigned to selected days`, color: 'green' });
    },
  });

  const handleEdit = (day: number, period: number) => {
    const entry = currentSection?.routine[day]?.[period];
    setEditSubject(entry?.subject || '');
    setEditTeacher(entry?.teacher || '');
    setEditCell({ day, period });
    openModal();
  };

  const handleSave = () => {
    if (editCell) {
      updateRoutineMutation.mutate({
        sectionIndex: selectedSectionIndex,
        day: editCell.day,
        period: editCell.period,
        subject: editSubject,
        teacher: editTeacher,
      });
    }
  };

  const handleCopyToAllDays = () => {
    if (copyPeriod !== null && copyTeacher && copySubject) {
      copyToAllDaysMutation.mutate();
    } else {
      notifications.show({ title: 'Error', message: 'Please select period, teacher, and subject', color: 'red' });
    }
  };

  const handleAssignToSelectedDays = () => {
    if (assignPeriod !== null && assignTeacher && assignSubject && assignDays.some(d => d)) {
      assignToSelectedDaysMutation.mutate();
    } else {
      notifications.show({ title: 'Error', message: 'Please select period, teacher, subject, and at least one day', color: 'red' });
    }
  };

  const classTeacher = currentSection?.routine[0]?.[0]?.teacher || 'Not set';

  if (isLoading) return <Loader />;

  return (
    <Stack p="md">
      <Title order={1}>Class Routine Editor</Title>

      <Select
        label="Academic Season"
        placeholder="Select season"
        data={seasons?.map(s => ({ value: s._id, label: s.name })) || []}
        value={selectedSeasonId}
        onChange={(val) => {
          setSelectedSeasonId(val || '');
          setSelectedClassId('');
        }}
      />

      <Select
        label="Class"
        placeholder="Select class"
        data={availableClasses.map(c => ({ value: c.id, label: c.className }))}
        value={selectedClassId}
        onChange={(val) => setSelectedClassId(val || '')}
        disabled={!selectedSeasonId}
      />

      {currentCS && currentSection && (
        <>
          <Group justify="space-between">
            <Title order={3}>Section {currentSection.name} ({periodCount} periods)</Title>
            <Badge color="blue" size="lg">Class Teacher: {classTeacher}</Badge>
            <Select
              value={selectedSectionIndex.toString()}
              data={currentCS.sections.map((sec, idx) => ({ value: idx.toString(), label: sec.name }))}
              onChange={(val) => setSelectedSectionIndex(parseInt(val || '0'))}
            />
          </Group>

          <Group>
            <Button onClick={openCopyModal} variant="light">Copy to All Days (Period)</Button>
            <Button onClick={openAssignModal} variant="light" color="teal">Assign to Selected Days (Period)</Button>
          </Group>

          <div style={{ overflowX: 'auto' }}>
            <Table striped highlightOnHover>
              <thead>
                <tr>
                  <th>Day / Period</th>
                  {Array.from({ length: periodCount }).map((_, i) => (
                    <th key={i}>Period {i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, d) => (
                  <tr key={d}>
                    <td style={{ fontWeight: 'bold' }}>{day}</td>
                    {Array.from({ length: periodCount }).map((_, p) => {
                      const entry = currentSection.routine[d]?.[p];
                      return (
                        <td
                          key={p}
                          style={{ cursor: 'pointer', backgroundColor: p === 0 ? '#f0f9ff' : 'inherit' }}
                          onClick={() => handleEdit(d, p)}
                        >
                          <div><strong>{entry?.subject || '—'}</strong></div>
                          <div style={{ fontSize: 12, color: 'gray' }}>{entry?.teacher || '—'}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      )}

      {/* Edit single cell modal */}
      <Modal opened={modalOpened} onClose={closeModal} title="Edit Period">
        <TextInput label="Subject" value={editSubject} onChange={e => setEditSubject(e.currentTarget.value)} required />
        <Select
          label="Teacher"
          placeholder="Select teacher"
          data={teachers.map(t => ({ value: t.name, label: t.name }))}
          value={editTeacher}
          onChange={(val) => {
            setEditTeacher(val || '');
            setEditSubject('');
          }}
          searchable
          clearable
          mt="md"
        />
        <Select
          label="Subject (filtered by teacher)"
          placeholder={editTeacher ? "Select subject" : "First select a teacher"}
          data={teachers.find(t => t.name === editTeacher)?.subjects.map(s => ({ value: s, label: s })) || []}
          value={editSubject}
          onChange={(val) => setEditSubject(val || '')}
          disabled={!editTeacher}
          searchable
          mt="md"
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeModal}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </Group>
      </Modal>

      {/* Copy to all days modal */}
      <Modal opened={copyModalOpened} onClose={closeCopyModal} title="Copy to All Days for a Period">
        <Select
          label="Select Period"
          placeholder="Choose period"
          data={Array.from({ length: periodCount }).map((_, i) => ({ value: i.toString(), label: `Period ${i + 1}` }))}
          value={copyPeriod?.toString()}
          onChange={(val) => setCopyPeriod(val !== null ? parseInt(val) : null)}
        />
        <Select
          label="Teacher"
          placeholder="Select teacher"
          data={teachers.map(t => ({ value: t.name, label: t.name }))}
          value={copyTeacher}
          onChange={(val) => {
            setCopyTeacher(val || '');
            setCopySubject('');
          }}
          searchable
          clearable
          mt="md"
        />
        <Select
          label="Subject (filtered by teacher)"
          placeholder={copyTeacher ? "Select subject" : "First select a teacher"}
          data={teachers.find(t => t.name === copyTeacher)?.subjects.map(s => ({ value: s, label: s })) || []}
          value={copySubject}
          onChange={(val) => setCopySubject(val || '')}
          disabled={!copyTeacher}
          searchable
          mt="md"
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeCopyModal}>Cancel</Button>
          <Button onClick={handleCopyToAllDays}>Copy to All Days</Button>
        </Group>
      </Modal>

      {/* Assign to selected days modal */}
      <Modal opened={assignModalOpened} onClose={closeAssignModal} title="Assign to Selected Days for a Period">
        <Select
          label="Select Period"
          placeholder="Choose period"
          data={Array.from({ length: periodCount }).map((_, i) => ({ value: i.toString(), label: `Period ${i + 1}` }))}
          value={assignPeriod?.toString()}
          onChange={(val) => setAssignPeriod(val !== null ? parseInt(val) : null)}
        />
        <Select
          label="Teacher"
          placeholder="Select teacher"
          data={teachers.map(t => ({ value: t.name, label: t.name }))}
          value={assignTeacher}
          onChange={(val) => {
            setAssignTeacher(val || '');
            setAssignSubject('');
          }}
          searchable
          clearable
          mt="md"
        />
        <Select
          label="Subject (filtered by teacher)"
          placeholder={assignTeacher ? "Select subject" : "First select a teacher"}
          data={teachers.find(t => t.name === assignTeacher)?.subjects.map(s => ({ value: s, label: s })) || []}
          value={assignSubject}
          onChange={(val) => setAssignSubject(val || '')}
          disabled={!assignTeacher}
          searchable
          mt="md"
        />
        <Divider label="Select Days" mt="md" />
        <Group mt="xs">
          {DAYS.map((day, idx) => (
            <Checkbox
              key={idx}
              label={day}
              checked={assignDays[idx]}
              onChange={(e) => {
                const newDays = [...assignDays];
                newDays[idx] = e.currentTarget.checked;
                setAssignDays(newDays);
              }}
            />
          ))}
        </Group>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeAssignModal}>Cancel</Button>
          <Button onClick={handleAssignToSelectedDays}>Assign to Selected Days</Button>
        </Group>
      </Modal>
    </Stack>
  );
}