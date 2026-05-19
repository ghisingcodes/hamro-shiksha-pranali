import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, TextInput, Group, Title, Checkbox, Badge, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCalendarPlus, IconCopy, IconEdit, IconCheck } from '@tabler/icons-react';
import { createColumnHelper, useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { api } from '../../lib/api';
import { AcademicSeason } from '../../lib/types';
import { notifications } from '@mantine/notifications';
import { DataTable } from '../../components/DataTable';

const columnHelper = createColumnHelper<AcademicSeason>();

export function AcademicSeasonsTab() {
  const queryClient = useQueryClient();
  const [modalOpen, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingSeason, setEditingSeason] = useState<AcademicSeason | null>(null);
  const [formData, setFormData] = useState({ name: '', startDate: '', endDate: '', isActive: false });

  const { data: seasons = [], isLoading } = useQuery<AcademicSeason[]>({
    queryKey: ['seasons'],
    queryFn: () => api.get('/academic-seasons').then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/academic-seasons', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      closeModal();
      notifications.show({ title: 'Success', message: 'Season created', color: 'green' });
    },
    onError: (err: any) => {
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Failed', color: 'red' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/academic-seasons/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      closeModal();
      notifications.show({ title: 'Success', message: 'Season updated', color: 'green' });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: ({ id, copyClasses }: { id: string; copyClasses: boolean }) =>
      api.post(`/academic-seasons/duplicate/${id}`, { copyClasses }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      notifications.show({ title: 'Success', message: 'Season duplicated', color: 'green' });
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const all = await api.get('/academic-seasons').then(res => res.data);
      for (const s of all) {
        if (s.isActive) await api.put(`/academic-seasons/${s._id}`, { isActive: false });
      }
      return api.put(`/academic-seasons/${id}`, { isActive: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      notifications.show({ title: 'Success', message: 'Active season updated', color: 'green' });
    },
  });

  const columns = useMemo(() => [
    columnHelper.accessor('name', { header: 'Name' }),
    columnHelper.accessor('startDate', { header: 'Start Date', cell: info => new Date(info.getValue()).toLocaleDateString() }),
    columnHelper.accessor('endDate', { header: 'End Date', cell: info => new Date(info.getValue()).toLocaleDateString() }),
    columnHelper.accessor('isActive', {
      header: 'Active',
      cell: info => info.getValue() ? <Badge color="green">Active</Badge> : <Badge color="gray">Inactive</Badge>,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Group gap="xs">
          <Button size="xs" variant="subtle" onClick={() => openEditModal(row.original)} leftSection={<IconEdit size={14} />}>Edit</Button>
          <Button size="xs" variant="subtle" onClick={() => duplicateMutation.mutate({ id: row.original._id, copyClasses: true })} leftSection={<IconCopy size={14} />}>Duplicate</Button>
          {!row.original.isActive && (
            <Button size="xs" variant="light" color="blue" onClick={() => setActiveMutation.mutate(row.original._id)} leftSection={<IconCheck size={14} />}>Set Active</Button>
          )}
        </Group>
      ),
    }),
  ], []);

  const table = useReactTable({ data: seasons, columns, getCoreRowModel: getCoreRowModel() });

  const openEditModal = (season: AcademicSeason) => {
    setEditingSeason(season);
    setFormData({
      name: season.name,
      startDate: season.startDate.split('T')[0],
      endDate: season.endDate.split('T')[0],
      isActive: season.isActive,
    });
    openModal();
  };

  const handleSubmit = () => {
    const payload = {
      name: formData.name,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      isActive: formData.isActive,
    };
    if (editingSeason) {
      updateMutation.mutate({ id: editingSeason._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Stack>
      <Group justify="space-between" mb="md">
        <Title order={3}>Academic Seasons</Title>
        <Button leftSection={<IconCalendarPlus size={18} />} onClick={() => { setEditingSeason(null); setFormData({ name: '', startDate: '', endDate: '', isActive: false }); openModal(); }}>
          New Season
        </Button>
      </Group>

      <DataTable table={table} isLoading={isLoading} />

      <Modal opened={modalOpen} onClose={closeModal} title={editingSeason ? 'Edit Season' : 'New Season'}>
        <TextInput label="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
        <TextInput label="Start Date" type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} mt="md" required />
        <TextInput label="End Date" type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} mt="md" required />
        <Checkbox label="Active" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.currentTarget.checked})} mt="md" />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeModal}>Cancel</Button>
          <Button onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending}>Save</Button>
        </Group>
      </Modal>
    </Stack>
  );
}