import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, TextInput, Select, Group, Title, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconUserPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { createColumnHelper } from '@tanstack/react-table';
import { api } from '../lib/api';
import { Student, AcademicSeason, Class } from '../lib/types';
import { notifications } from '@mantine/notifications';
import { DataTable } from '../components/DataTable';

const columnHelper = createColumnHelper<Student>();

export function StudentsPage() {
  const queryClient = useQueryClient();
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [modalOpen, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({ name: '', rollNumber: '', classId: '', section: '', parentPhone: '', address: '' });

  const { data: seasons } = useQuery<AcademicSeason[]>({ queryKey: ['seasons'], queryFn: () => api.get('/academic-seasons').then(res => res.data) });
  const { data: classes } = useQuery<Class[]>({ queryKey: ['classes'], queryFn: () => api.get('/classes').then(res => res.data) });
  const { data: students = [], isLoading, refetch } = useQuery<Student[]>({
    queryKey: ['students', selectedSeasonId],
    queryFn: () => api.get(`/students?seasonId=${selectedSeasonId}`).then(res => res.data),
    enabled: !!selectedSeasonId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/students', { ...data, seasonId: selectedSeasonId }),
    onSuccess: () => { refetch(); closeModal(); notifications.show({ title: 'Success', message: 'Student added', color: 'green' }); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/students/${id}`, data),
    onSuccess: () => { refetch(); closeModal(); notifications.show({ title: 'Success', message: 'Student updated', color: 'green' }); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/students/${id}`),
    onSuccess: () => { refetch(); notifications.show({ title: 'Success', message: 'Student deleted', color: 'green' }); },
  });

  const columns = useMemo(() => [
    columnHelper.accessor('rollNumber', { header: 'Roll No' }),
    columnHelper.accessor('name', { header: 'Name' }),
    columnHelper.accessor('classId', { header: 'Class', cell: info => (info.getValue() as any)?.displayName || info.getValue() }),
    columnHelper.accessor('section', { header: 'Section' }),
    columnHelper.accessor('parentPhone', { header: 'Parent Phone' }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Group gap="xs">
          <Button size="xs" variant="subtle" onClick={() => openEditModal(row.original)}><IconEdit size={14} /></Button>
          <Button size="xs" variant="subtle" color="red" onClick={() => deleteMutation.mutate(row.original._id)}><IconTrash size={14} /></Button>
        </Group>
      ),
    }),
  ], []);

  const { getCoreRowModel, useReactTable } = require('@tanstack/react-table');
  const table = useReactTable({ data: students, columns, getCoreRowModel: getCoreRowModel() });

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      rollNumber: student.rollNumber,
      classId: typeof student.classId === 'string' ? student.classId : (student.classId as any)._id,
      section: student.section,
      parentPhone: student.parentPhone || '',
      address: student.address || '',
    });
    openModal();
  };

  const handleSubmit = () => {
    const payload = { ...formData, classId: formData.classId };
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Stack p="md">
      <Group justify="space-between">
        <Title order={1}>Students</Title>
        <Select
          placeholder="Select Academic Season"
          data={seasons?.map(s => ({ value: s._id, label: s.name })) || []}
          value={selectedSeasonId}
          onChange={(val) => setSelectedSeasonId(val || '')}
          style={{ width: 250 }}
        />
        <Button leftSection={<IconUserPlus size={18} />} onClick={() => { setEditingStudent(null); setFormData({ name: '', rollNumber: '', classId: '', section: '', parentPhone: '', address: '' }); openModal(); }} disabled={!selectedSeasonId}>
          Add Student
        </Button>
      </Group>

      <DataTable table={table} isLoading={isLoading} />

      <Modal opened={modalOpen} onClose={closeModal} title={editingStudent ? 'Edit Student' : 'Add Student'}>
        <TextInput label="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
        <TextInput label="Roll Number" value={formData.rollNumber} onChange={e => setFormData({...formData, rollNumber: e.target.value})} required mt="md" />
        <Select label="Class" data={classes?.map(c => ({ value: c._id, label: c.displayName })) || []} value={formData.classId} onChange={val => setFormData({...formData, classId: val || ''})} required mt="md" />
        <TextInput label="Section" value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} required mt="md" />
        <TextInput label="Parent Phone" value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} mt="md" />
        <TextInput label="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} mt="md" />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeModal}>Cancel</Button>
          <Button onClick={handleSubmit}>Save</Button>
        </Group>
      </Modal>
    </Stack>
  );
}