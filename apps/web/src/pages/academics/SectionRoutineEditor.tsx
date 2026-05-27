import { useState, useEffect } from 'react';
import { Modal, Table, Button, TextInput, Select, Group, Stack, Alert, ActionIcon, Text } from '@mantine/core';
import { useMutation, useQuery } from '@tanstack/react-query';
import { IconRefresh } from '@tabler/icons-react';
import { api } from '../../lib/api';
import { Teacher } from '../../lib/types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface SectionRoutineEditorProps {
  opened: boolean;
  onClose: () => void;
  classSectionId: string;
  sectionIndex: number;
  periodCount: number;
  initialRoutine: any[][];
  onRoutineUpdated: () => void;
}

export function SectionRoutineEditor({
  opened,
  onClose,
  classSectionId,
  sectionIndex,
  periodCount,
  initialRoutine,
  onRoutineUpdated,
}: SectionRoutineEditorProps) {
  const [routine, setRoutine] = useState(initialRoutine);
  const [editCell, setEditCell] = useState<{ day: number; period: number } | null>(null);
  const [subject, setSubject] = useState('');
  const [teacher, setTeacher] = useState('');
  const [copyPeriod, setCopyPeriod] = useState<number | null>(null);
  const [copySubject, setCopySubject] = useState('');
  const [copyTeacher, setCopyTeacher] = useState('');

  const { data: teachers, refetch: refetchTeachers } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then(res => res.data),
  });

  useEffect(() => {
    setRoutine(initialRoutine);
  }, [initialRoutine]);

  const updateRoutineMutation = useMutation({
    mutationFn: ({ day, period, subject, teacher }: any) =>
      api.put(`/class-sections/${classSectionId}/routine`, {
        sectionIndex,
        day,
        period,
        subject,
        teacher,
      }),
    onSuccess: () => {
      onRoutineUpdated();
      setEditCell(null);
    },
  });

  const copyToAllDaysMutation = useMutation({
    mutationFn: async () => {
      if (copyPeriod === null) return;
      const promises = [];
      for (let day = 0; day < 5; day++) {
        promises.push(
          api.put(`/class-sections/${classSectionId}/routine`, {
            sectionIndex,
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
      onRoutineUpdated();
      setCopyPeriod(null);
      setCopySubject('');
      setCopyTeacher('');
      alert('Copied to all days successfully!');
    },
  });

  const handleEditCell = (day: number, period: number) => {
    const cell = routine[day]?.[period] || { subject: '', teacher: '' };
    setSubject(cell.subject);
    setTeacher(cell.teacher);
    setEditCell({ day, period });
  };

  const handleSaveCell = () => {
    if (editCell) {
      updateRoutineMutation.mutate({
        day: editCell.day,
        period: editCell.period,
        subject,
        teacher,
      });
    }
  };

  const handleCopyToAllDays = () => {
    if (copyPeriod !== null && copySubject && copyTeacher) {
      copyToAllDaysMutation.mutate();
    } else {
      alert('Please select period, subject, and teacher');
    }
  };

  const classTeacher = routine[0]?.[0]?.teacher || 'Not set';

  return (
    <Modal opened={opened} onClose={onClose} size="xl" title="Edit Section Routine">
      <Alert color="blue" mb="md">
        👩‍🏫 **Class Teacher (Period 1):** {classTeacher}
      </Alert>

      <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
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
                  const cell = routine[d]?.[p] || { subject: '', teacher: '' };
                  return (
                    <td key={p} style={{ padding: '4px', minWidth: '120px' }}>
                      <div><strong>{cell.subject || '—'}</strong></div>
                      <div style={{ fontSize: '11px', color: 'gray' }}>{cell.teacher || '—'}</div>
                      <Button size="xs" variant="subtle" onClick={() => handleEditCell(d, p)} mt="4">
                        Edit
                      </Button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <div style={{ borderTop: '1px solid #e9ecef', marginTop: '1rem', paddingTop: '1rem' }}>
        <Group align="flex-end">
          <Select
            label="Copy Period"
            placeholder="Select period"
            data={Array.from({ length: periodCount }).map((_, i) => ({ value: i.toString(), label: `Period ${i + 1}` }))}
            value={copyPeriod?.toString()}
            onChange={(val) => setCopyPeriod(val !== null ? parseInt(val) : null)}
            style={{ flex: 1 }}
          />
          <TextInput
            label="Subject"
            placeholder="Subject"
            value={copySubject}
            onChange={(e) => setCopySubject(e.target.value)}
            style={{ flex: 1 }}
          />
          <Select
            label="Teacher"
            placeholder="Select teacher"
            data={teachers?.map((t: any) => ({ value: t.name, label: t.name })) || []}
            value={copyTeacher}
            onChange={(val) => setCopyTeacher(val || '')}
            searchable
            style={{ flex: 1 }}
          />
          <Button onClick={handleCopyToAllDays} loading={copyToAllDaysMutation.isPending}>
            Copy to All Days
          </Button>
          <ActionIcon onClick={() => refetchTeachers()} variant="subtle">
            <IconRefresh size={16} />
          </ActionIcon>
        </Group>
        <Text size="xs" c="dimmed" mt="4">Copies the subject and teacher to <strong>all 5 days</strong> for the selected period.</Text>
      </div>

      {editCell && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: 20,
            borderRadius: 8,
            zIndex: 1000,
            boxShadow: '0 0 20px rgba(0,0,0,0.3)',
            minWidth: 300,
          }}
        >
          <Stack>
            <Text fw={500}>Edit Period {editCell.period + 1} on {DAYS[editCell.day]}</Text>
            <TextInput
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              autoFocus
            />
            <Select
              label="Teacher"
              placeholder="Select teacher"
              data={teachers?.map((t: any) => ({ value: t.name, label: t.name })) || []}
              value={teacher}
              onChange={(val) => setTeacher(val || '')}
              searchable
            />
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={() => setEditCell(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCell} loading={updateRoutineMutation.isPending}>
                Save
              </Button>
            </Group>
          </Stack>
        </div>
      )}
    </Modal>
  );
}