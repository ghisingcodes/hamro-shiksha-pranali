import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, TextInput, Select, Group, Title, Stack, Loader, NumberInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconUserPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { createColumnHelper, useReactTable, getCoreRowModel, getPaginationRowModel } from '@tanstack/react-table';
import { api } from '../../lib/api';
import { notifications } from '@mantine/notifications';
import { DataTable } from '../../components/DataTable';

interface Staff {
  _id: string;
  staffId: string;
  name: string;
  phone?: string;
  email?: string;
  position?: string;
  department?: string;
  salary?: number;
}

const POSITION_OPTIONS = [
  'Accountant', 'Librarian', 'Receptionist', 'Security', 'Cleaner', 'Maintenance', 'Driver', 'Canteen', 'Other'
];

const DEPARTMENT_OPTIONS = [
  'Administration', 'Accounts', 'Library', 'Security', 'Maintenance', 'Transport', 'Canteen', 'Other'
];

export function StaffPage() {
  const queryClient = useQueryClient();
  const [modalOpen, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    staffId: '',
    name: '',
    phone: '',
    email: '',
    position: '',
    department: '',
    salary: 0,
  });

  const { data: staffList, isLoading } = useQuery<Staff[]>({
    queryKey: ['staff'],
    queryFn: () => api.get('/staff').then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/staff', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      closeModal();
      notifications.show({ title: 'Success', message: 'Staff added', color: 'green' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/staff/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      closeModal();
      notifications.show({ title: 'Success', message: 'Staff updated', color: 'green' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      notifications.show({ title: 'Success', message: 'Staff deleted', color: 'green' });
    },
  });

  const columnHelper = createColumnHelper<Staff>();
  const columns = useMemo(() => [
    columnHelper.accessor('staffId', { header: 'Staff ID' }),
    columnHelper.accessor('name', { header: 'Name' }),
    columnHelper.accessor('position', { header: 'Position' }),
    columnHelper.accessor('department', { header: 'Department' }),
    columnHelper.accessor('phone', { header: 'Phone' }),
    columnHelper.accessor('email', { header: 'Email' }),
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

  const table = useReactTable({ data: staffList || [], columns, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel() });

  const openEditModal = (staff: Staff) => {
    setEditingStaff(staff);
    setFormData({
      staffId: staff.staffId,
      name: staff.name,
      phone: staff.phone || '',
      email: staff.email || '',
      position: staff.position || '',
      department: staff.department || '',
      salary: staff.salary || 0,
    });
    openModal();
  };

  const handleSubmit = () => {
    if (editingStaff) {
      updateMutation.mutate({ id: editingStaff._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Stack p="md">
      <Group justify="space-between">
        <Title order={1}>Staff Management</Title>
        <Button leftSection={<IconUserPlus size={18} />} onClick={() => { setEditingStaff(null); setFormData({ staffId: '', name: '', phone: '', email: '', position: '', department: '', salary: 0 }); openModal(); }}>
          Add Staff
        </Button>
      </Group>

      {isLoading ? <Loader /> : <DataTable table={table} />}

      <Modal opened={modalOpen} onClose={closeModal} title={editingStaff ? 'Edit Staff' : 'Add Staff'} size="md">
        <TextInput label="Staff ID" value={formData.staffId} onChange={e => setFormData({...formData, staffId: e.target.value})} required />
        <TextInput label="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required mt="md" />
        <TextInput label="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} mt="md" />
        <TextInput label="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} mt="md" />
        <Select label="Position" data={POSITION_OPTIONS} value={formData.position} onChange={(val) => setFormData({...formData, position: val || ''})} mt="md" searchable />
        <Select label="Department" data={DEPARTMENT_OPTIONS} value={formData.department} onChange={(val) => setFormData({...formData, department: val || ''})} mt="md" searchable />
        <NumberInput label="Salary" value={formData.salary} onChange={(val) => setFormData({...formData, salary: val || 0})} mt="md" min={0} />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeModal}>Cancel</Button>
          <Button onClick={handleSubmit}>Save</Button>
        </Group>
      </Modal>
    </Stack>
  );
}