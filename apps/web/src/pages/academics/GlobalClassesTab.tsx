import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, TextInput, NumberInput, Group, Title, ActionIcon, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconTrash, IconEdit, IconPlus } from '@tabler/icons-react';
import { createColumnHelper, useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { api } from '../../lib/api';
import { Class } from '../../lib/types';
import { notifications } from '@mantine/notifications';
import { DataTable } from '../../components/DataTable';

const columnHelper = createColumnHelper<Class>();

export function GlobalClassesTab() {
  const queryClient = useQueryClient();
  const [createModalOpen, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
  const [editModalOpen, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [newClass, setNewClass] = useState({ name: '', displayName: '', grade: 5, periodCount: 7 });
  const [editFormData, setEditFormData] = useState({ name: '', displayName: '', grade: 5, periodCount: 7 });

  const { data: classes = [], isLoading } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then(res => res.data),
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => api.post('/classes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      closeCreateModal();
      setNewClass({ name: '', displayName: '', grade: 5, periodCount: 7 });
      notifications.show({ title: 'Success', message: 'Class added', color: 'green' });
    },
    onError: (err: any) => {
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Failed', color: 'red' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Class> }) => api.put(`/classes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      closeEditModal();
      setSelectedClass(null);
      notifications.show({ title: 'Success', message: 'Class updated', color: 'green' });
    },
    onError: (err: any) => {
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Update failed', color: 'red' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/classes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      notifications.show({ title: 'Success', message: 'Class deleted', color: 'green' });
    },
    onError: (err: any) => {
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Delete failed', color: 'red' });
    },
  });

  const columns = useMemo(() => [
    columnHelper.accessor('name', { header: 'Name' }),
    columnHelper.accessor('displayName', { header: 'Display Name' }),
    columnHelper.accessor('grade', { header: 'Grade' }),
    columnHelper.accessor('periodCount', { header: 'Periods' }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Group gap="xs">
          <ActionIcon variant="subtle" color="blue" onClick={() => handleEditClick(row.original)}>
            <IconEdit size={18} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(row.original)}>
            <IconTrash size={18} />
          </ActionIcon>
        </Group>
      ),
    }),
  ], []);

  const table = useReactTable({
    data: classes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleEditClick = (cls: Class) => {
    setSelectedClass(cls);
    setEditFormData({
      name: cls.name,
      displayName: cls.displayName,
      grade: cls.grade,
      periodCount: cls.periodCount,
    });
    openEditModal();
  };

  const handleUpdate = () => {
    if (!selectedClass) return;
    updateMutation.mutate({ id: selectedClass._id, data: editFormData });
  };

  const handleDelete = (cls: Class) => {
    if (confirm(`Delete class "${cls.displayName}" permanently?`)) {
      deleteMutation.mutate(cls._id);
    }
  };

  const handleCreate = () => {
    if (!newClass.name || !newClass.displayName) {
      notifications.show({ title: 'Error', message: 'Please fill all fields', color: 'red' });
      return;
    }
    addMutation.mutate(newClass);
  };

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={3}>Global Classes</Title>
        <Button leftSection={<IconPlus size={18} />} onClick={openCreateModal}>Add Class</Button>
      </Group>

      <DataTable table={table} isLoading={isLoading} />

      {/* Create Modal */}
      <Modal opened={createModalOpen} onClose={closeCreateModal} title="Add New Class">
        <TextInput label="Name (unique)" value={newClass.name} onChange={e => setNewClass({...newClass, name: e.target.value})} />
        <TextInput label="Display Name" value={newClass.displayName} onChange={e => setNewClass({...newClass, displayName: e.target.value})} mt="md" />
        <NumberInput label="Grade (0-12)" value={newClass.grade} onChange={val => setNewClass({...newClass, grade: val || 5})} mt="md" />
        <NumberInput label="Period Count (5 or 7)" value={newClass.periodCount} onChange={val => setNewClass({...newClass, periodCount: val || 7})} mt="md" />
        <Group justify="flex-end" mt="md">
          <Button onClick={handleCreate} loading={addMutation.isPending}>Create</Button>
        </Group>
      </Modal>

      {/* Edit Modal */}
      <Modal opened={editModalOpen} onClose={closeEditModal} title="Edit Class">
        <TextInput label="Name" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
        <TextInput label="Display Name" value={editFormData.displayName} onChange={e => setEditFormData({...editFormData, displayName: e.target.value})} mt="md" />
        <NumberInput label="Grade" value={editFormData.grade} onChange={val => setEditFormData({...editFormData, grade: val || 5})} mt="md" />
        <NumberInput label="Period Count" value={editFormData.periodCount} onChange={val => setEditFormData({...editFormData, periodCount: val || 7})} mt="md" />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeEditModal}>Cancel</Button>
          <Button onClick={handleUpdate} loading={updateMutation.isPending}>Save</Button>
        </Group>
      </Modal>
    </>
  );
}