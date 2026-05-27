import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button, Modal, TextInput, Select, Group, Title, Stack, Loader, Alert, Badge,
  Tooltip, ActionIcon, Textarea, MultiSelect, NumberInput, Paper, Divider,
  Switch, Table, Grid, ThemeIcon, ScrollArea, Text
} from '@mantine/core';
import { IconUserPlus, IconEdit, IconTrash, IconUser, IconRefresh, 
         IconBriefcase, IconDoorExit, IconBook, IconId, IconMail, IconPhone,
         IconCalendar, IconEye, IconLock, IconLockOpen } from '@tabler/icons-react';
import { createColumnHelper, useReactTable, getCoreRowModel, getPaginationRowModel } from '@tanstack/react-table';
import { api } from '../lib/api';
import { notifications } from '@mantine/notifications';
import { DataTable } from '../components/DataTable';
import { useDisclosure } from '@mantine/hooks';

const SUBJECTS_LIST = [
  'Mathematics', 'Science', 'English', 'Nepali', 'Social Studies',
  'Computer Science', 'Physics', 'Chemistry', 'Biology', 'History',
  'Geography', 'Economics', 'Accountancy', 'Business Studies', 'Health Education',
  'Physical Education', 'Art', 'Music', 'Dance', 'Moral Science'
];

const QUALIFICATION_LIST = [
  'SLC/SEE', '+2/Intermediate', 'Bachelor', 'Master', 'MPhil', 'PhD',
  'B.Ed', 'M.Ed', 'B.Sc', 'M.Sc', 'BE', 'ME', 'LLB', 'LLM', 'CA',
  'CSIT', 'BBA', 'MBA', 'Diploma', 'Certificate', 'Other'
];

const EMPLOYMENT_TYPES = [
  { value: 'permanent', label: 'Permanent', icon: '✅' },
  { value: 'contract', label: 'Contract', icon: '📄' },
  { value: 'part_time', label: 'Part Time', icon: '⏰' },
  { value: 'visiting', label: 'Visiting', icon: '🚶' },
];

const STATUS_COLORS: Record<string, string> = {
  active: 'green',
  on_leave: 'orange',
  resigned: 'red',
  terminated: 'dark',
  contract_ended: 'gray',
};

const STATUS_LABELS: Record<string, string> = {
  active: '✅ Active',
  on_leave: '⏳ On Leave',
  resigned: '❌ Resigned',
  terminated: '⚠️ Terminated',
  contract_ended: '📄 Contract Ended',
};

interface Teacher {
  _id: string;
  teacherId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  qualification?: string;
  experience?: number;
  subjects: string[];
  userId?: { _id: string; email: string; name: string; isActive: boolean } | null;
  status: string;
  employmentType: string;
  contractEndDate?: string;
  lastWorkingDate?: string;
  reasonForLeave?: string;
  joiningDate?: string;
  isActive: boolean;
  contractHistory?: Array<{ seasonId: string; renewalDate: string; endDate: string }>;
}

interface AcademicSeason {
  _id: string;
  name: string;
  isActive: boolean;
}

export function TeachersPage() {
  const queryClient = useQueryClient();
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [modalOpen, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [renewModalOpen, { open: openRenewModal, close: closeRenewModal }] = useDisclosure(false);
  const [leaveModalOpen, { open: openLeaveModal, close: closeLeaveModal }] = useDisclosure(false);
  const [detailModalOpen, { open: openDetailModalDisclosure, close: closeDetailModal }] = useDisclosure(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    qualification: '',
    experience: 0,
    employmentType: 'contract',
    subjects: [] as string[],
  });
  const [renewForm, setRenewForm] = useState({ seasonId: '' });
  const [leaveForm, setLeaveForm] = useState({ reason: '' });
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const schoolId = user.schoolId;

  const { data: seasons } = useQuery<AcademicSeason[]>({
    queryKey: ['seasons'],
    queryFn: () => api.get('/academic-seasons').then(res => res.data),
  });

  const { data: teachers, isLoading, refetch } = useQuery<Teacher[]>({
    queryKey: ['teachers', schoolId, selectedSeasonId],
    queryFn: () => api.get(`/teachers?schoolId=${schoolId}&seasonId=${selectedSeasonId}`).then(res => res.data),
    enabled: !!schoolId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/teachers', data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      closeModal();
      const defaultPassword = res.data?.defaultPassword;
      if (defaultPassword) {
        notifications.show({ 
          title: 'Success', 
          message: `Teacher added! Default password: ${defaultPassword}`, 
          color: 'green',
          autoClose: 10000
        });
      } else {
        notifications.show({ title: 'Success', message: 'Teacher added', color: 'green' });
      }
    },
    onError: (err: any) => {
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Failed to add teacher', color: 'red' });
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

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      return api.put(`/users/${userId}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      notifications.show({ title: 'Success', message: 'User status updated', color: 'green' });
    },
  });

  const renewContractMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.post(`/teachers/${id}/renew-contract`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      closeRenewModal();
      notifications.show({ title: 'Success', message: 'Contract renewed', color: 'green' });
    },
  });

  const processLeaveMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.post(`/teachers/${id}/leave`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      closeLeaveModal();
      notifications.show({ title: 'Success', message: 'Leave processed', color: 'green' });
    },
  });

  const handleSubmit = () => {
    if (editingTeacher) {
      updateMutation.mutate({ id: editingTeacher._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleRenewContract = () => {
    if (selectedTeacher) {
      const selectedSeason = seasons?.find(s => s._id === renewForm.seasonId);
      if (selectedSeason) {
        const newEndDate = new Date(selectedSeason.endDate);
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        renewContractMutation.mutate({ id: selectedTeacher._id, data: { seasonId: renewForm.seasonId, newEndDate } });
      } else {
        renewContractMutation.mutate({ id: selectedTeacher._id, data: { seasonId: renewForm.seasonId, newEndDate: new Date() } });
      }
    }
  };

  const handleProcessLeave = () => {
    if (selectedTeacher) {
      const lastWorkingDate = new Date();
      processLeaveMutation.mutate({ id: selectedTeacher._id, data: { lastWorkingDate, reason: leaveForm.reason } });
    }
  };

  const handleToggleUserStatus = (teacher: Teacher) => {
    if (teacher.userId) {
      toggleUserStatusMutation.mutate({ 
        userId: teacher.userId._id, 
        isActive: !(teacher.userId as any).isActive 
      });
    }
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      phone: teacher.phone || '',
      email: teacher.email || '',
      address: teacher.address || '',
      qualification: teacher.qualification || '',
      experience: teacher.experience || 0,
      employmentType: teacher.employmentType || 'contract',
      subjects: teacher.subjects || [],
    });
    openModal();
  };

  const openDetailModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    openDetailModalDisclosure();
  };

  const openRenewModalForTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setRenewForm({ seasonId: seasons?.find(s => s.isActive)?._id || '' });
    openRenewModal();
  };

  const openLeaveModalForTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setLeaveForm({ reason: '' });
    openLeaveModal();
  };

  const getStatusColor = (status: string) => STATUS_COLORS[status] || 'gray';
  const getStatusLabel = (status: string) => STATUS_LABELS[status] || status;

  const columnHelper = createColumnHelper<Teacher>();
  const columns = useMemo(() => [
    columnHelper.accessor('teacherId', { header: 'ID', size: 100 }),
    columnHelper.accessor('name', { header: 'Name', size: 160 }),
    columnHelper.accessor('qualification', { header: 'Qualification', size: 120, cell: (info) => info.getValue() || '—' }),
    columnHelper.accessor('subjects', {
      header: 'Subjects',
      size: 200,
      cell: (info) => (
        <Group gap={4}>
          {info.getValue().slice(0, 2).map(s => <Badge key={s} size="sm">{s}</Badge>)}
          {info.getValue().length > 2 && <Badge size="sm">+{info.getValue().length - 2}</Badge>}
        </Group>
      ),
    }),
    columnHelper.accessor('employmentType', { header: 'Type', size: 100, cell: (info) => <Badge variant="light">{info.getValue()}</Badge> }),
    columnHelper.accessor('status', {
      header: 'Status',
      size: 120,
      cell: (info) => <Badge color={getStatusColor(info.getValue())}>{getStatusLabel(info.getValue())}</Badge>,
    }),
    columnHelper.display({
      id: 'userAccount',
      header: 'User',
      size: 120,
      cell: ({ row }) => (
        row.original.userId ? (
          <Group gap={4}>
            <Badge color={row.original.userId.isActive ? 'green' : 'red'}>
              {row.original.userId.isActive ? '✅ Active' : '❌ Inactive'}
            </Badge>
            <Tooltip label={row.original.userId.isActive ? 'Disable User' : 'Enable User'}>
              <ActionIcon 
                size="sm" 
                color={row.original.userId.isActive ? 'red' : 'green'}
                onClick={() => handleToggleUserStatus(row.original)}
              >
                {row.original.userId.isActive ? <IconLock size={14} /> : <IconLockOpen size={14} />}
              </ActionIcon>
            </Tooltip>
          </Group>
        ) : (
          <Badge color="orange">⏳ No Account</Badge>
        )
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      size: 200,
      cell: ({ row }) => (
        <Group gap={4}>
          <Tooltip label="View Details">
            <ActionIcon variant="subtle" color="gray" onClick={() => openDetailModal(row.original)}>
              <IconEye size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Edit">
            <ActionIcon variant="subtle" color="blue" onClick={() => openEditModal(row.original)}>
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete">
            <ActionIcon variant="subtle" color="red" onClick={() => deleteMutation.mutate(row.original._id)}>
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Renew Contract">
            <ActionIcon variant="subtle" color="green" onClick={() => openRenewModalForTeacher(row.original)}>
              <IconBriefcase size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Process Leave">
            <ActionIcon variant="subtle" color="orange" onClick={() => openLeaveModalForTeacher(row.original)}>
              <IconDoorExit size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ),
    }),
  ], []);

  const table = useReactTable({
    data: teachers || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  if (!schoolId) {
    return <Loader />;
  }

  return (
    <Stack p="md">
      <Group justify="space-between">
        <Title order={1}>Teacher Management</Title>
        <Group>
          <Select
            placeholder="Filter by Season"
            data={seasons?.map(s => ({ value: s._id, label: s.name })) || []}
            value={selectedSeasonId}
            onChange={setSelectedSeasonId}
            clearable
            style={{ width: 200 }}
          />
          <Tooltip label="Refresh">
            <ActionIcon onClick={() => refetch()} variant="light" size="lg">
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
          <Button leftSection={<IconUserPlus size={18} />} onClick={() => { setEditingTeacher(null); setFormData({ name: '', phone: '', email: '', address: '', qualification: '', experience: 0, employmentType: 'contract', subjects: [] }); openModal(); }}>
            Add Teacher
          </Button>
        </Group>
      </Group>

      {isLoading ? <Loader /> : teachers?.length === 0 ? (
        <Alert color="blue">No teachers found. Click "Add Teacher" to create one.</Alert>
      ) : (
        <DataTable table={table} />
      )}

      {/* Add/Edit Teacher Modal */}
      <Modal opened={modalOpen} onClose={closeModal} title={editingTeacher ? 'Edit Teacher' : 'Add Teacher'} size="lg">
        <Stack>
          <TextInput label="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          <Group grow>
            <TextInput label="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <TextInput label="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
          </Group>
          <TextInput label="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          <Group grow>
            <Select label="Qualification" data={QUALIFICATION_LIST} value={formData.qualification} onChange={(val) => setFormData({...formData, qualification: val || ''})} searchable />
            <NumberInput label="Experience (years)" value={formData.experience} onChange={(val) => setFormData({...formData, experience: val || 0})} min={0} />
          </Group>
          <Select label="Employment Type" data={EMPLOYMENT_TYPES} value={formData.employmentType} onChange={(val) => setFormData({...formData, employmentType: val || 'contract'})} />
          <MultiSelect label="Subjects" data={SUBJECTS_LIST} value={formData.subjects} onChange={(val) => setFormData({...formData, subjects: val})} searchable clearable />
          <Alert color="blue" mt="md">
            A user account will be automatically created for this teacher using the provided email.
          </Alert>
        </Stack>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeModal}>Cancel</Button>
          <Button onClick={handleSubmit}>Save</Button>
        </Group>
      </Modal>

      {/* Teacher Details Modal */}
      <Modal opened={detailModalOpen} onClose={closeDetailModal} title="Teacher Details" size="xl" scrollAreaComponent={ScrollArea}>
        {selectedTeacher && (
          <Stack>
            {/* Personal Information Section */}
            <Paper withBorder p="md" radius="md">
              <Group mb="md">
                <ThemeIcon size="lg" color="blue" variant="light" radius="xl">
                  <IconUser size={20} />
                </ThemeIcon>
                <Title order={4}>Personal Information</Title>
              </Group>
              <Divider mb="md" />
              <Grid>
                <Grid.Col span={6}>
                  <Group>
                    <IconId size={16} color="gray" />
                    <Text fw={500}>Teacher ID:</Text>
                    <Text>{selectedTeacher.teacherId}</Text>
                  </Group>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Group>
                    <IconUser size={16} color="gray" />
                    <Text fw={500}>Name:</Text>
                    <Text>{selectedTeacher.name}</Text>
                  </Group>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Group>
                    <IconPhone size={16} color="gray" />
                    <Text fw={500}>Phone:</Text>
                    <Text>{selectedTeacher.phone || '—'}</Text>
                  </Group>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Group>
                    <IconMail size={16} color="gray" />
                    <Text fw={500}>Email:</Text>
                    <Text>{selectedTeacher.email || '—'}</Text>
                  </Group>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Group>
                    <IconBriefcase size={16} color="gray" />
                    <Text fw={500}>Address:</Text>
                    <Text>{selectedTeacher.address || '—'}</Text>
                  </Group>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Group>
                    <IconBook size={16} color="gray" />
                    <Text fw={500}>Qualification:</Text>
                    <Text>{selectedTeacher.qualification || '—'}</Text>
                  </Group>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Group>
                    <IconCalendar size={16} color="gray" />
                    <Text fw={500}>Experience:</Text>
                    <Text>{selectedTeacher.experience || 0} years</Text>
                  </Group>
                </Grid.Col>
              </Grid>
            </Paper>

            {/* Employment Details Section */}
            <Paper withBorder p="md" radius="md">
              <Group mb="md">
                <ThemeIcon size="lg" color="green" variant="light" radius="xl">
                  <IconBriefcase size={20} />
                </ThemeIcon>
                <Title order={4}>Employment Details</Title>
              </Group>
              <Divider mb="md" />
              <Grid>
                <Grid.Col span={4}>
                  <Text fw={500}>Employment Type:</Text>
                  <Badge variant="light" size="lg">{selectedTeacher.employmentType}</Badge>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text fw={500}>Status:</Text>
                  <Badge color={getStatusColor(selectedTeacher.status)} size="lg">
                    {getStatusLabel(selectedTeacher.status)}
                  </Badge>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text fw={500}>Contract End Date:</Text>
                  <Text>{selectedTeacher.contractEndDate ? new Date(selectedTeacher.contractEndDate).toLocaleDateString() : '—'}</Text>
                </Grid.Col>
                {selectedTeacher.lastWorkingDate && (
                  <Grid.Col span={6}>
                    <Text fw={500}>Last Working Day:</Text>
                    <Text>{new Date(selectedTeacher.lastWorkingDate).toLocaleDateString()}</Text>
                  </Grid.Col>
                )}
                {selectedTeacher.reasonForLeave && (
                  <Grid.Col span={12}>
                    <Text fw={500}>Reason for Leave:</Text>
                    <Text>{selectedTeacher.reasonForLeave}</Text>
                  </Grid.Col>
                )}
              </Grid>
            </Paper>

            {/* Subjects Section */}
            <Paper withBorder p="md" radius="md">
              <Group mb="md">
                <ThemeIcon size="lg" color="orange" variant="light" radius="xl">
                  <IconBook size={20} />
                </ThemeIcon>
                <Title order={4}>Subjects</Title>
              </Group>
              <Divider mb="md" />
              <Group gap={4}>
                {selectedTeacher.subjects?.length > 0 ? (
                  selectedTeacher.subjects.map(s => <Badge key={s} size="md" variant="filled">{s}</Badge>)
                ) : (
                  <Text c="dimmed">No subjects assigned</Text>
                )}
              </Group>
            </Paper>

            {/* User Account Section */}
            <Paper withBorder p="md" radius="md">
              <Group mb="md" justify="space-between">
                <Group>
                  <ThemeIcon size="lg" color="violet" variant="light" radius="xl">
                    <IconUser size={20} />
                  </ThemeIcon>
                  <Title order={4}>User Account</Title>
                </Group>
                {selectedTeacher.userId && (
                  <Switch
                    label={selectedTeacher.userId.isActive ? 'Active' : 'Inactive'}
                    checked={selectedTeacher.userId.isActive}
                    onChange={() => handleToggleUserStatus(selectedTeacher)}
                    color="green"
                    size="md"
                  />
                )}
              </Group>
              <Divider mb="md" />
              {selectedTeacher.userId ? (
                <Grid>
                  <Grid.Col span={6}>
                    <Text fw={500}>Email:</Text>
                    <Text>{(selectedTeacher.userId as any)?.email}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text fw={500}>Status:</Text>
                    <Badge color={selectedTeacher.userId.isActive ? 'green' : 'red'}>
                      {selectedTeacher.userId.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Grid.Col>
                </Grid>
              ) : (
                <Alert color="orange" variant="light">
                  No user account associated with this teacher.
                </Alert>
              )}
            </Paper>

            {/* Contract History Section */}
            {selectedTeacher.contractHistory && selectedTeacher.contractHistory.length > 0 && (
              <Paper withBorder p="md" radius="md">
                <Group mb="md">
                  <ThemeIcon size="lg" color="teal" variant="light" radius="xl">
                    <IconCalendar size={20} />
                  </ThemeIcon>
                  <Title order={4}>Contract History</Title>
                </Group>
                <Divider mb="md" />
                <Table striped highlightOnHover>
                  <thead>
                    <tr>
                      <th>Season</th>
                      <th>Renewal Date</th>
                      <th>End Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTeacher.contractHistory.map((history, idx) => (
                      <tr key={idx}>
                        <td>{(history as any).seasonId?.name || 'Unknown'}</td>
                        <td>{new Date(history.renewalDate).toLocaleDateString()}</td>
                        <td>{new Date(history.endDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Paper>
            )}
          </Stack>
        )}
      </Modal>

      {/* Renew Contract Modal */}
      <Modal opened={renewModalOpen} onClose={closeRenewModal} title={`Renew Contract - ${selectedTeacher?.name}`} size="md">
        <Stack>
          <Select
            label="Select Season"
            data={seasons?.map(s => ({ value: s._id, label: s.name })) || []}
            value={renewForm.seasonId}
            onChange={(val) => setRenewForm({...renewForm, seasonId: val || ''})}
            required
          />
          <Alert color="blue" mt="md" variant="light">
            The contract will be renewed with end date set to one year after the season ends.
          </Alert>
        </Stack>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeRenewModal}>Cancel</Button>
          <Button onClick={handleRenewContract}>Renew Contract</Button>
        </Group>
      </Modal>

      {/* Process Leave Modal */}
      <Modal opened={leaveModalOpen} onClose={closeLeaveModal} title={`Process Leave - ${selectedTeacher?.name}`} size="md">
        <Stack>
          <Textarea
            label="Reason for Leave"
            value={leaveForm.reason}
            onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})}
            required
            minRows={3}
            placeholder="Please provide the reason for leave..."
          />
          <Alert color="orange" mt="md" variant="light">
            ⚠️ The last working day will be set to today's date.
          </Alert>
        </Stack>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeLeaveModal}>Cancel</Button>
          <Button color="red" onClick={handleProcessLeave}>Process Leave</Button>
        </Group>
      </Modal>
    </Stack>
  );
}