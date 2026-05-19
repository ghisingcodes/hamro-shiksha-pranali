import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, TextInput, Group, Title, Stack, MultiSelect } from '@mantine/core';
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
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subjects: [] as string[] });

  const { data: teachers = [], isLoading } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/teachers', data),
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
    mutationFn: ({ id, data }: any) => api.put(`/teachers/${id}`, data),
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
    setFormData({ name: teacher.name, email: teacher.email, phone: teacher.phone || '', subjects: teacher.subjects || [] });
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
        <Button leftSection={<IconUserPlus size={18} />} onClick={() => { setEditingTeacher(null); setFormData({ name: '', email: '', phone: '', subjects: [] }); openModal(); }}>
          Add Teacher
        </Button>
      </Group>

      <DataTable table={table} isLoading={isLoading} />

      <Modal opened={modalOpen} onClose={closeModal} title={editingTeacher ? 'Edit Teacher' : 'Add Teacher'}>
        <TextInput label="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
        <TextInput label="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required mt="md" />
        <TextInput label="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} mt="md" />
        <MultiSelect
          label="Subjects"
          placeholder="Type subject and press Enter"
          data={[]}
          value={formData.subjects}
          onChange={(val) => setFormData({...formData, subjects: val})}
          searchable
          creatable
          getCreateLabel={(q) => `+ Add "${q}"`}
          onCreate={(q) => {
            // Update the formData subjects array with the new subject
            const newSubjects = [...formData.subjects, q];
            setFormData({...formData, subjects: newSubjects});
            return q; // tells MultiSelect to add the option
          }}
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