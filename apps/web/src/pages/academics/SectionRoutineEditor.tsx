import { useState, useEffect } from 'react';
import { Modal, Table, Button, TextInput, Select, Group, Alert } from '@mantine/core';
import { useMutation, useQuery } from '@tanstack/react-query';
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

  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then(res => res.data),
  });

  useEffect(() => {
    if (editCell) {
      const cell = routine[editCell.day]?.[editCell.period];
      setSubject(cell?.subject || '');
      setTeacher(cell?.teacher || '');
    }
  }, [editCell, routine]);

  const updateMutation = useMutation({
    mutationFn: ({ day, period, subject, teacher }: any) =>
      api.put(`/class-sections/${classSectionId}/routine`, { sectionIndex, day, period, subject, teacher }),
    onSuccess: () => {
      onRoutineUpdated();
      setEditCell(null);
    },
  });

  const handleSave = () => {
    if (editCell) {
      updateMutation.mutate({
        day: editCell.day,
        period: editCell.period,
        subject,
        teacher,
      });
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} size="xl" title="Edit Routine">
      <Alert color="blue" mb="md">
        👩‍🏫 Select teacher from the dropdown (teachers must be added first).
      </Alert>
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
                  const cell = routine[d]?.[p] || { subject: '', teacher: '' };
                  return (
                    <td key={p} style={{ padding: '4px', minWidth: '150px' }}>
                      <div><strong>{cell.subject || '—'}</strong></div>
                      <div style={{ fontSize: '12px', color: 'gray' }}>{cell.teacher || '—'}</div>
                      <Button size="xs" variant="subtle" onClick={() => setEditCell({ day: d, period: p })} mt="4">
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

      <Modal opened={!!editCell} onClose={() => setEditCell(null)} title="Edit Period">
        <TextInput label="Subject" value={subject} onChange={e => setSubject(e.currentTarget.value)} mb="md" />
        <Select
          label="Teacher"
          placeholder="Select teacher"
          data={teachers?.map(t => ({ value: t.name, label: t.name })) || []}
          value={teacher}
          onChange={(val) => setTeacher(val || '')}
          searchable
          clearable
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setEditCell(null)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </Group>
      </Modal>
    </Modal>
  );
}