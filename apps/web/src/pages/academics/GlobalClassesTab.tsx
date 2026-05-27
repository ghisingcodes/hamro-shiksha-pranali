import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, TextInput, NumberInput, Group, Title, Stack, Loader, Alert, ActionIcon, Badge } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash, IconRefresh } from '@tabler/icons-react';
import { createColumnHelper, useReactTable, getCoreRowModel, getPaginationRowModel } from '@tanstack/react-table';
import { api } from '../../lib/api';
import { notifications } from '@mantine/notifications';
import { DataTable } from '../../components/DataTable';

interface Class {
  _id: string;
  name: string;
  displayName: string;
  grade: number;
  periodCount: number;
  isActive: boolean;
}

export function GlobalClassesTab() {
  const queryClient = useQueryClient();
  const [modalOpen, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    grade: 0,
    periodCount: 5,
  });

  const { data: classes = [], isLoading, refetch } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/classes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      closeModal();
      notifications.show({ title: 'Success', message: 'Class created', color: 'green' });
    },
    onError: (err: any) => {
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Failed', color: 'red' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/classes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      closeModal();
      notifications.show({ title: 'Success', message: 'Class updated', color: 'green' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/classes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      notifications.show({ title: 'Success', message: 'Class deleted', color: 'green' });
    },
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.displayName) {
      notifications.show({ title: 'Error', message: 'Please fill required fields', color: 'red' });
      return;
    }
    if (editingClass) {
      updateMutation.mutate({ id: editingClass._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEditModal = (cls: Class) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      displayName: cls.displayName,
      grade: cls.grade,
      periodCount: cls.periodCount,
    });
    openModal();
  };

  const columnHelper = createColumnHelper<Class>();
  const columns = useMemo(() => [
    columnHelper.accessor('name', { header: 'Name' }),
    columnHelper.accessor('displayName', { header: 'Display Name' }),
    columnHelper.accessor('grade', { header: 'Grade', cell: info => {
      const grade = info.getValue();
      if (grade === 0) return 'Nursery';
      if (grade === 1) return 'LKG';
      if (grade === 2) return 'UKG';
      return `Class ${grade - 2}`;
    } }),
    columnHelper.accessor('periodCount', { header: 'Periods' }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Group gap="xs">
          <ActionIcon variant="subtle" color="blue" onClick={() => openEditModal(row.original)}>
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={() => deleteMutation.mutate(row.original._id)}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      ),
    }),
  ], []);

  const table = useReactTable({
    data: classes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <Stack>
      <Group justify="space-between" mb="md">
        <Title order={3}>Global Classes</Title>
        <Group>
          <Button variant="light" onClick={() => refetch()} leftSection={<IconRefresh size={16} />}>Refresh</Button>
          <Button onClick={() => { setEditingClass(null); setFormData({ name: '', displayName: '', grade: 0, periodCount: 5 }); openModal(); }} leftSection={<IconPlus size={16} />}>
            Add Class
          </Button>
        </Group>
      </Group>

      {isLoading ? <Loader /> : <DataTable table={table} />}

      <Modal opened={modalOpen} onClose={closeModal} title={editingClass ? 'Edit Class' : 'Add Class'} size="md">
        <TextInput label="Name (unique)" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
        <TextInput label="Display Name" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} mt="md" required />
        <NumberInput label="Grade (0-12)" value={formData.grade} onChange={val => setFormData({...formData, grade: val || 0})} mt="md" min={0} max={12} />
        <NumberInput label="Period Count (5 or 7)" value={formData.periodCount} onChange={val => setFormData({...formData, periodCount: val || 5})} mt="md" min={5} max={7} />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeModal}>Cancel</Button>
          <Button onClick={handleSubmit}>Save</Button>
        </Group>
      </Modal>
    </Stack>
  );
}