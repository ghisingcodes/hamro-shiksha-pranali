import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, Table, Button, Modal, TextInput, Group, Stack, Title, Loader, Alert } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { api } from '../lib/api';
import { AcademicSeason, ClassSection, Teacher } from '../lib/types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function ClassRoutinePage() {
  const queryClient = useQueryClient();
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedClassSectionId, setSelectedClassSectionId] = useState('');
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [editCell, setEditCell] = useState<{ day: number; period: number } | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editTeacher, setEditTeacher] = useState('');
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const { data: seasons } = useQuery({
    queryKey: ['seasons'],
    queryFn: () => api.get('/academic-seasons').then(res => res.data),
  });

  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then(res => res.data),
  });

  const { data: classSections, refetch } = useQuery<ClassSection[]>({
    queryKey: ['classSections', selectedSeasonId],
    queryFn: () => api.get(`/class-sections?seasonId=${selectedSeasonId}`).then(res => res.data),
    enabled: !!selectedSeasonId,
  });

  const currentCS = classSections?.find(cs => cs._id === selectedClassSectionId);
  const currentSection = currentCS?.sections[selectedSectionIndex];
  const periodCount = (currentCS?.classId as any)?.periodCount || 7;

  const updateRoutineMutation = useMutation({
    mutationFn: ({ sectionIndex, day, period, subject, teacher }: any) =>
      api.put(`/class-sections/${selectedClassSectionId}/routine`, { sectionIndex, day, period, subject, teacher }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classSections', selectedSeasonId] });
      closeModal();
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

  return (
    <Stack p="md">
      <Title order={1}>Class Routine Editor</Title>
      
      <Select
        label="Academic Season"
        placeholder="Select season"
        data={seasons?.map(s => ({ value: s._id, label: s.name })) || []}
        value={selectedSeasonId}
        onChange={(val) => { setSelectedSeasonId(val || ''); setSelectedClassSectionId(''); }}
      />
      
      <Select
        label="Class & Section"
        placeholder="Select class and section"
        data={classSections?.flatMap(cs =>
          cs.sections.map((sec, idx) => ({
            value: cs._id,
            label: `${(cs.classId as any).displayName} - Section ${sec.name}`,
            group: (cs.classId as any).displayName,
            sectionIndex: idx,
          }))
        ) || []}
        value={selectedClassSectionId}
        onChange={(val) => {
          setSelectedClassSectionId(val || '');
          const selected = classSections?.find(cs => cs._id === val);
          if (selected) {
            const firstSection = selected.sections[0];
            setSelectedSectionIndex(0);
          }
        }}
        disabled={!selectedSeasonId}
      />
      
      {currentCS && currentSection && (
        <>
          <Group justify="space-between">
            <Title order={3}>Section {currentSection.name} ({periodCount} periods)</Title>
            <Select
              value={selectedSectionIndex.toString()}
              data={currentCS.sections.map((sec, idx) => ({ value: idx.toString(), label: sec.name }))}
              onChange={(val) => setSelectedSectionIndex(parseInt(val || '0'))}
            />
          </Group>
          
          <div style={{ overflowX: 'auto' }}>
            <Table striped highlightOnHover>
              <thead><tr><th>Day / Period</th>{Array.from({ length: periodCount }).map((_, i) => <th key={i}>Period {i+1}</th>)}</tr></thead>
              <tbody>
                {DAYS.map((day, d) => (
                  <tr key={d}>
                    <td>{day}</td>
                    {Array.from({ length: periodCount }).map((_, p) => {
                      const entry = currentSection.routine[d]?.[p];
                      return (
                        <td key={p} style={{ cursor: 'pointer' }} onClick={() => handleEdit(d, p)}>
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
      
      <Modal opened={modalOpened} onClose={closeModal} title="Edit Period">
        <TextInput label="Subject" value={editSubject} onChange={e => setEditSubject(e.target.value)} />
        <Select
          label="Teacher"
          placeholder="Select teacher"
          data={teachers?.map(t => ({ value: t.name, label: t.name })) || []}
          value={editTeacher}
          onChange={(val) => setEditTeacher(val || '')}
          searchable
          clearable
        />
        <Group justify="flex-end" mt="md">
          <Button onClick={handleSave}>Save</Button>
        </Group>
      </Modal>
    </Stack>
  );
}