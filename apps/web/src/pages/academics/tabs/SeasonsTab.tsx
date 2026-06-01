import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, TextInput, Group, Title, Stack, Loader, Alert, Badge, Checkbox } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCalendarPlus, IconCopy, IconEdit, IconCheck, IconTrash } from '@tabler/icons-react';
import { createColumnHelper, useReactTable, getCoreRowModel, getPaginationRowModel } from '@tanstack/react-table';
import { api } from '../../../lib/api';
import { AcademicSeason } from '../../../lib/types';
import { notifications } from '@mantine/notifications';
import { DataTable } from '../../../components/DataTable';

const columnHelper = createColumnHelper<AcademicSeason>();

interface SeasonsTabProps {
  onSeasonChange: (seasonId: string) => void;
}

export function SeasonsTab({ onSeasonChange }: SeasonsTabProps) {
  const queryClient = useQueryClient();
  const [modalOpen, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingSeason, setEditingSeason] = useState<AcademicSeason | null>(null);
  const [formData, setFormData] = useState({ name: '', startDate: '', endDate: '', isActive: false });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const schoolId = user.schoolId;

  const { data: seasons = [], isLoading, refetch } = useQuery<AcademicSeason[]>({
    queryKey: ['seasons'],
    queryFn: () => api.get('/academic-seasons', { headers: { 'X-School-Id': schoolId } }).then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/academic-seasons', data, { headers: { 'X-School-Id': schoolId } }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      closeModal();
      // Auto-select the newly created season
      if (res.data?._id) {
        onSeasonChange(res.data._id);
      }
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/academic-seasons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      notifications.show({ title: 'Success', message: 'Season deleted', color: 'green' });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: ({ id, copyClasses }: { id: string; copyClasses: boolean }) =>
      api.post(`/academic-seasons/duplicate/${id}`, { copyClasses }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      if (res.data?._id) {
        onSeasonChange(res.data._id);
      }
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
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      onSeasonChange(res.data?._id);
      notifications.show({ title: 'Success', message: 'Active season updated', color: 'green' });
    },
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.startDate || !formData.endDate) {
      notifications.show({ title: 'Error', message: 'Please fill all fields', color: 'red' });
      return;
    }
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
          <Button size="xs" variant="subtle" color="red" onClick={() => deleteMutation.mutate(row.original._id)} leftSection={<IconTrash size={14} />}>Delete</Button>
          <Button size="xs" variant="subtle" onClick={() => duplicateMutation.mutate({ id: row.original._id, copyClasses: true })} leftSection={<IconCopy size={14} />}>Duplicate</Button>
          {!row.original.isActive && (
            <Button size="xs" variant="light" color="blue" onClick={() => setActiveMutation.mutate(row.original._id)} leftSection={<IconCheck size={14} />}>Set Active</Button>
          )}
        </Group>
      ),
    }),
  ], []);

  const table = useReactTable({
    data: seasons,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <Stack>
      <Group justify="space-between" mb="md">
        <Title order={3}>Academic Seasons</Title>
        <Button leftSection={<IconCalendarPlus size={18} />} onClick={() => { setEditingSeason(null); setFormData({ name: '', startDate: '', endDate: '', isActive: false }); openModal(); }}>
          New Season
        </Button>
      </Group>

      {isLoading ? <Loader /> : <DataTable table={table} />}

      <Modal opened={modalOpen} onClose={closeModal} title={editingSeason ? 'Edit Academic Season' : 'New Academic Season'}>
        <TextInput label="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
        <TextInput label="Start Date" type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} mt="md" required />
        <TextInput label="End Date" type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} mt="md" required />
        <Checkbox label="Set as Active Season" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.currentTarget.checked})} mt="md" />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeModal}>Cancel</Button>
          <Button onClick={handleSubmit}>Save</Button>
        </Group>
      </Modal>
    </Stack>
  );
}