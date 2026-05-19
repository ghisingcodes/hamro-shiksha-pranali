import { useState, useEffect } from 'react';
import { Table, Button, Modal, TextInput, Select, Group, Stack, Alert } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Teacher } from '../lib/types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface RoutineEditorProps {
  routine: { subject: string; teacher: string }[][];
  periodCount: number;
  onSave: (day: number, period: number, subject: string, teacher: string) => void;
}

export function RoutineEditor({ routine, periodCount, onSave }: RoutineEditorProps) {
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

  const handleSave = () => {
    if (editCell) {
      onSave(editCell.day, editCell.period, subject, teacher);
      setEditCell(null);
    }
  };

  return (
    <>
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

      <Modal
        opened={!!editCell}
        onClose={() => setEditCell(null)}
        title={`Edit Period ${editCell ? `(Day ${DAYS[editCell.day]}, Period ${editCell.period + 1})` : ''}`}
      >
        <TextInput
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.currentTarget.value)}
          mb="md"
        />
        <Select
          label="Teacher"
          placeholder="Select teacher"
          data={teachers?.map(t => ({ value: t.name, label: t.name })) || []}
          value={teacher}
          onChange={(val) => setTeacher(val || '')}
          searchable
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setEditCell(null)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </Group>
      </Modal>
    </>
  );
}