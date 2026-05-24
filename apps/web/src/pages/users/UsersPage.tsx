import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button, Modal, TextInput, Select, Group, Title, Stack, Loader, Alert, Badge, PasswordInput, Switch
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconUserPlus, IconEdit, IconTrash, IconLock } from '@tabler/icons-react';
import { createColumnHelper, useReactTable, getCoreRowModel, getPaginationRowModel } from '@tanstack/react-table';
import { api } from '../../lib/api';
import { notifications } from '@mantine/notifications';
import { DataTable } from '../../components/DataTable';

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'staff', label: 'Staff' },
  { value: 'parent', label: 'Parent' },
];

interface User {
  _id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
}

export function UsersPage() {
  const queryClient = useQueryClient();
  const [modalOpen, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'teacher',
  });

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
      notifications.show({ title: 'Success', message: 'User created', color: 'green' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
      notifications.show({ title: 'Success', message: 'User updated', color: 'green' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notifications.show({ title: 'Success', message: 'User deleted', color: 'green' });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => api.put(`/users/${id}/toggle-status`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notifications.show({ title: 'Success', message: 'User status updated', color: 'green' });
    },
  });

  const handleSubmit = () => {
    if (editingUser) {
      const { password, ...rest } = formData;
      const data = password ? formData : rest;
      updateMutation.mutate({ id: editingUser._id, data });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      phone: user.phone || '',
      role: user.role,
    });
    openModal();
  };

  const columnHelper = createColumnHelper<User>();
  const columns = useMemo(() => [
    columnHelper.accessor('name', { header: 'Name' }),
    columnHelper.accessor('email', { header: 'Email' }),
    columnHelper.accessor('phone', { header: 'Phone' }),
    columnHelper.accessor('role', {
      header: 'Role',
      cell: (info) => <Badge>{info.getValue()}</Badge>,
    }),
    columnHelper.accessor('isActive', {
      header: 'Status',
      cell: (info) => (
        <Badge color={info.getValue() ? 'green' : 'red'}>{info.getValue() ? 'Active' : 'Inactive'}</Badge>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Group gap="xs">
          <Button size="xs" variant="subtle" onClick={() => openEditModal(row.original)}><IconEdit size={14} /></Button>
          <Button size="xs" variant="subtle" color="red" onClick={() => deleteMutation.mutate(row.original._id)}><IconTrash size={14} /></Button>
          <Button size="xs" variant="subtle" onClick={() => toggleStatusMutation.mutate(row.original._id)}>
            <IconLock size={14} />
          </Button>
        </Group>
      ),
    }),
  ], []);

  const table = useReactTable({ data: users || [], columns, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel() });

  return (
    <Stack p="md">
      <Group justify="space-between">
        <Title order={1}>User Management</Title>
        <Button leftSection={<IconUserPlus size={18} />} onClick={() => { setEditingUser(null); setFormData({ email: '', password: '', name: '', phone: '', role: 'teacher' }); openModal(); }}>
          Add User
        </Button>
      </Group>

      {isLoading ? <Loader /> : <DataTable table={table} />}

      <Modal opened={modalOpen} onClose={closeModal} title={editingUser ? 'Edit User' : 'Add User'}>
        <TextInput label="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
        <TextInput label="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required mt="md" />
        <TextInput label="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} mt="md" />
        {!editingUser && (
          <PasswordInput label="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required mt="md" />
        )}
        <Select label="Role" data={ROLE_OPTIONS} value={formData.role} onChange={(val) => setFormData({...formData, role: val || 'teacher'})} mt="md" />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeModal}>Cancel</Button>
          <Button onClick={handleSubmit}>Save</Button>
        </Group>
      </Modal>
    </Stack>
  );
}