// src/pages/staff/StaffPage.tsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Button, Modal, TextInput, Select, Group, Title, Stack, Loader, Alert, Badge,
  NumberInput, Tooltip, ActionIcon, Paper
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconUserPlus, IconEdit, IconTrash, IconRefresh } from '@tabler/icons-react';
import { createColumnHelper, useReactTable, getCoreRowModel, getPaginationRowModel } from '@tanstack/react-table';
import { api } from '../../lib/api';
import { notifications } from '@mantine/notifications';
import { DataTable } from '../../components/DataTable';

const POSITION_OPTIONS = [
  'Accountant', 'Librarian', 'Receptionist', 'Security', 'Cleaner', 
  'Maintenance', 'Driver', 'Canteen', 'Administrative Officer', 'IT Assistant',
  'Lab Assistant', 'Sports Coordinator', 'Hostel Warden', 'Transport Manager',
  'Store Keeper', 'Data Entry Operator', 'Office Assistant', 'Counselor', 'Nurse'
];

const DEPARTMENT_OPTIONS = [
  'Administration', 'Accounts', 'Library', 'Security', 'Maintenance', 
  'Transport', 'Canteen', 'IT', 'Hostel', 'Sports', 'Medical'
];

interface Staff {
  _id: string;
  staffId: string;
  name: string;
  phone?: string;
  email?: string;
  position?: string;
  department?: string;
  salary?: number;
  userId?: { _id: string; email: string } | null;
}

export function StaffPage() {
  const queryClient = useQueryClient();
  const [modalOpen, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    position: '',
    department: '',
    salary: 0,
    address: '',
    emergencyContact: '',
  });

  const { data: staffList, isLoading, refetch } = useQuery<Staff[]>({
    queryKey: ['staff'],
    queryFn: () => api.get('/staff').then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/staff', data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      closeModal();
      const defaultPassword = res.data?.defaultPassword;
      if (defaultPassword) {
        notifications.show({ 
          title: 'Success', 
          message: `Staff added! Default password: ${defaultPassword}`, 
          color: 'green',
          autoClose: 10000
        });
      } else {
        notifications.show({ title: 'Success', message: 'Staff added', color: 'green' });
      }
    },
    onError: (err: any) => {
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Failed', color: 'red' });
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

  const handleSubmit = () => {
    if (editingStaff) {
      updateMutation.mutate({ id: editingStaff._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEditModal = (staff: Staff) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      phone: staff.phone || '',
      email: staff.email || '',
      position: staff.position || '',
      department: staff.department || '',
      salary: staff.salary || 0,
      address: '',
      emergencyContact: '',
    });
    openModal();
  };

  const columnHelper = createColumnHelper<Staff>();
  const columns = useMemo(() => [
    columnHelper.accessor('staffId', { header: 'Staff ID', size: 120 }),
    columnHelper.accessor('name', { header: 'Name', size: 160 }),
    columnHelper.accessor('position', { header: 'Position', size: 140 }),
    columnHelper.accessor('department', { header: 'Department', size: 120 }),
    columnHelper.accessor('phone', { header: 'Phone', size: 120 }),
    columnHelper.accessor('email', { header: 'Email', size: 180 }),
    columnHelper.display({
      id: 'userAccount',
      header: 'User',
      size: 100,
      cell: ({ row }) => (
        row.original.userId ? (
          <Badge color="green">✅ Active</Badge>
        ) : (
          <Badge color="orange">⏳ No Account</Badge>
        )
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      size: 120,
      cell: ({ row }) => (
        <Group gap={4}>
          <Tooltip label="Edit">
            <ActionIcon variant="subtle" color="blue" onClick={() => openEditModal(row.original)}><IconEdit size={16} /></ActionIcon>
          </Tooltip>
          <Tooltip label="Delete">
            <ActionIcon variant="subtle" color="red" onClick={() => deleteMutation.mutate(row.original._id)}><IconTrash size={16} /></ActionIcon>
          </Tooltip>
        </Group>
      ),
    }),
  ], []);

  const table = useReactTable({
    data: staffList || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  return (
    <Stack p="md">
      <Group justify="space-between">
        <Title order={1}>Staff Management</Title>
        <Group>
          <Tooltip label="Refresh">
            <ActionIcon onClick={() => refetch()} variant="light" size="lg">
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
          <Button leftSection={<IconUserPlus size={18} />} onClick={() => { setEditingStaff(null); setFormData({ name: '', phone: '', email: '', position: '', department: '', salary: 0, address: '', emergencyContact: '' }); openModal(); }}>
            Add Staff
          </Button>
        </Group>
      </Group>

      {isLoading ? <Loader /> : <DataTable table={table} />}

      <Modal opened={modalOpen} onClose={closeModal} title={editingStaff ? 'Edit Staff' : 'Add Staff'} size="md">
        <Stack>
          <TextInput label="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          <Group grow>
            <TextInput label="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <TextInput label="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
          </Group>
          <Select label="Position" data={POSITION_OPTIONS} value={formData.position} onChange={(val) => setFormData({...formData, position: val || ''})} searchable />
          <Select label="Department" data={DEPARTMENT_OPTIONS} value={formData.department} onChange={(val) => setFormData({...formData, department: val || ''})} searchable />
          <NumberInput label="Salary" value={formData.salary} onChange={(val) => setFormData({...formData, salary: val || 0})} min={0} />
          <TextInput label="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          <TextInput label="Emergency Contact" value={formData.emergencyContact} onChange={e => setFormData({...formData, emergencyContact: e.target.value})} />
          <Alert color="blue">A user account will be automatically created for this staff member using the provided email.</Alert>
        </Stack>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeModal}>Cancel</Button>
          <Button onClick={handleSubmit}>Save</Button>
        </Group>
      </Modal>
    </Stack>
  );
}