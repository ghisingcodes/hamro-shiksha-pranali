import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, TextInput, Group, Title, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconUserPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { createColumnHelper, useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { api } from '../lib/api';
import { Teacher } from '../lib/types';
import { notifications } from '@mantine/notifications';
import { DataTable } from '../components/DataTable';

const columnHelper = createColumnHelper<Teacher>();

export function TeachersPage() {
  const queryClient = useQueryClient();
  const [modalOpen, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subjects: '' });

  const { data: teachers = [], isLoading } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const subjectsArray = data.subjects ? data.subjects.split(',').map((s: string) => s.trim()).filter(s => s) : [];
      return api.post('/teachers', { ...data, subjects: subjectsArray });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      closeModal();
      notifications.show({ title: 'Success', message: 'Teacher added', color: 'green' });
    },
    onError: (err: any) => {
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Failed', color: 'red' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => {
      const subjectsArray = data.subjects ? data.subjects.split(',').map((s: string) => s.trim()).filter(s => s) : [];
      return api.put(`/teachers/${id}`, { ...data, subjects: subjectsArray });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      closeModal();
      notifications.show({ title: 'Success', message: 'Teacher updated', color: 'green' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/teachers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      notifications.show({ title: 'Success', message: 'Teacher deleted', color: 'green' });
    },
  });

  const columns = useMemo(() => [
    columnHelper.accessor('name', { header: 'Name' }),
    columnHelper.accessor('email', { header: 'Email' }),
    columnHelper.accessor('phone', { header: 'Phone' }),
    columnHelper.accessor('subjects', { header: 'Subjects', cell: info => info.getValue().join(', ') }),
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

  const table = useReactTable({ data: teachers, columns, getCoreRowModel: getCoreRowModel() });

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || '',
      subjects: teacher.subjects.join(', '),
    });
    openModal();
  };

  const handleSubmit = () => {
    const payload = { ...formData };
    if (editingTeacher) {
      updateMutation.mutate({ id: editingTeacher._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Stack p="md">
      <Group justify="space-between">
        <Title order={1}>Teachers</Title>
        <Button leftSection={<IconUserPlus size={18} />} onClick={() => { setEditingTeacher(null); setFormData({ name: '', email: '', phone: '', subjects: '' }); openModal(); }}>
          Add Teacher
        </Button>
      </Group>

      <DataTable table={table} isLoading={isLoading} />

      <Modal opened={modalOpen} onClose={closeModal} title={editingTeacher ? 'Edit Teacher' : 'Add Teacher'}>
        <TextInput label="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
        <TextInput label="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required mt="md" />
        <TextInput label="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} mt="md" />
        <TextInput
          label="Subjects (comma separated)"
          placeholder="Math, Science, English"
          value={formData.subjects}
          onChange={e => setFormData({...formData, subjects: e.target.value})}
          mt="md"
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeModal}>Cancel</Button>
          <Button onClick={handleSubmit}>Save</Button>
        </Group>
      </Modal>
    </Stack>
  );
}