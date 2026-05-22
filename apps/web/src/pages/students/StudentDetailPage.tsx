import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, Title, Text, Card, Grid, Group, Badge, Button, Loader, Alert, Table, Modal, TextInput, Select, Divider, Tabs, NumberInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconEdit, IconArrowLeft } from '@tabler/icons-react';
import { api } from '../../lib/api';
import { Student, AcademicRecord, EnrollmentRecord, Class, AcademicSeason } from '../../lib/types';
import { notifications } from '@mantine/notifications';

export function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editRecord, setEditRecord] = useState<AcademicRecord | null>(null);
  const [editModalOpen, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
  const [editForm, setEditForm] = useState({ classId: '', section: '', rollNumber: '', status: 'active' });

  const [feeModalOpen, { open: openFeeModal, close: closeFeeModal }] = useDisclosure(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentRecord | null>(null);
  const [feeForm, setFeeForm] = useState({ paidAmount: 0, remarks: '' });

  const { data: student } = useQuery<Student>({ queryKey: ['student', id], queryFn: () => api.get(`/students/${id}`).then(res => res.data), enabled: !!id });
  const { data: academicRecords, refetch: refetchRecords } = useQuery<AcademicRecord[]>({ queryKey: ['academicRecords', id], queryFn: () => api.get(`/academic-records?studentId=${id}`).then(res => res.data), enabled: !!id });
  const { data: enrollmentRecords, refetch: refetchEnrollments } = useQuery<EnrollmentRecord[]>({ queryKey: ['enrollmentRecords', id], queryFn: () => api.get(`/enrollment-records?studentId=${id}`).then(res => res.data), enabled: !!id });
  const { data: classes } = useQuery<Class[]>({ queryKey: ['classes'], queryFn: () => api.get('/classes').then(res => res.data) });

  const updateRecordMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/academic-records/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['academicRecords', id] }); closeEditModal(); notifications.show({ title: 'Success', message: 'Record updated', color: 'green' }); },
  });

  const updateFeeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/enrollment-records/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['enrollmentRecords', id] }); closeFeeModal(); notifications.show({ title: 'Success', message: 'Payment recorded', color: 'green' }); },
  });

  const handleEditClick = (record: AcademicRecord) => {
    setEditRecord(record);
    setEditForm({
      classId: typeof record.classId === 'string' ? record.classId : record.classId._id,
      section: record.section,
      rollNumber: record.rollNumber || '',
      status: record.status,
    });
    openEditModal();
  };

  const handleUpdateRecord = () => { if (editRecord) updateRecordMutation.mutate({ id: editRecord._id, data: editForm }); };
  const handleAddPayment = () => { if (selectedEnrollment) updateFeeMutation.mutate({ id: selectedEnrollment._id, data: { paidAmount: selectedEnrollment.paidAmount + feeForm.paidAmount, remarks: feeForm.remarks } }); };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'promoted': return 'blue';
      case 'failed': return 'red';
      case 'repeated': return 'orange';
      case 'left': return 'gray';
      case 'graduated': return 'teal';
      default: return 'gray';
    }
  };

  if (!student) return <Loader />;

  return (
    <Stack p="md">
      <Group mb="md"><Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/students')}>Back</Button><Title order={1}>Student Details</Title></Group>
      <Tabs defaultValue="info">
        <Tabs.List><Tabs.Tab value="info">Personal</Tabs.Tab><Tabs.Tab value="parents">Parents</Tabs.Tab><Tabs.Tab value="academic">Academic History</Tabs.Tab><Tabs.Tab value="enrollment">Enrollment & Fees</Tabs.Tab></Tabs.List>
        
        <Tabs.Panel value="info" pt="md">
          <Card withBorder><Grid><Grid.Col span={6}><Text fw={700}>Student ID</Text><Text>{student.studentId}</Text></Grid.Col><Grid.Col span={6}><Text fw={700}>Name</Text><Text>{student.name}</Text></Grid.Col>
          <Grid.Col span={6}><Text fw={700}>DOB</Text><Text>{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '—'}</Text></Grid.Col><Grid.Col span={6}><Text fw={700}>Gender</Text><Text>{student.gender || '—'}</Text></Grid.Col>
          <Grid.Col span={6}><Text fw={700}>Lives with</Text><Text>{student.liveWith || '—'}</Text></Grid.Col><Grid.Col span={6}><Text fw={700}>Mobile Access</Text><Text>{student.mobileAccess || '—'}</Text></Grid.Col>
          <Grid.Col span={6}><Text fw={700}>Internet Access</Text><Text>{student.internetAccess || '—'}</Text></Grid.Col>
          <Grid.Col span={12}><Text fw={700}>Health Problems</Text><Group gap="xs">{student.longTermHealth?.map(h => <Badge key={h}>{h}</Badge>) || '—'}</Group></Grid.Col>
          <Grid.Col span={12}><Text fw={700}>Behaviours</Text><Group gap="xs">{student.abnormalBehaviour?.map(b => <Badge key={b}>{b}</Badge>) || '—'}</Group></Grid.Col>
          <Grid.Col span={12}><Text fw={700}>Permanent Address</Text><Text>{student.permanentAddress || '—'}</Text></Grid.Col>
          <Grid.Col span={12}><Text fw={700}>Temporary Address</Text><Text>{student.temporaryAddress || student.permanentAddress || '—'}</Text></Grid.Col></Grid></Card>
        </Tabs.Panel>

        <Tabs.Panel value="parents" pt="md">
          {student.parents?.map((parent, idx) => (<Card key={idx} withBorder mb="md"><Group><Title order={4}>{parent.relation}: {parent.name}</Title>{parent.isPrimary && <Badge color="blue">Primary</Badge>}</Group>
          <Grid mt="sm"><Grid.Col span={4}><Text fw={500}>Phone:</Text><Text>{parent.phone}</Text></Grid.Col><Grid.Col span={4}><Text fw={500}>Email:</Text><Text>{parent.email || '—'}</Text></Grid.Col>
          <Grid.Col span={4}><Text fw={500}>Occupation:</Text><Text>{parent.occupation || '—'}</Text></Grid.Col><Grid.Col span={4}><Text fw={500}>Monthly Income:</Text><Text>{parent.monthlyIncome || '—'}</Text></Grid.Col>
          <Grid.Col span={4}><Text fw={500}>Yearly Income:</Text><Text>{parent.yearlyIncome || '—'}</Text></Grid.Col><Grid.Col span={4}><Text fw={500}>Education:</Text><Text>{parent.education || '—'}</Text></Grid.Col></Grid></Card>))}
        </Tabs.Panel>

        <Tabs.Panel value="academic" pt="md">
          <Table striped><thead><tr><th>Season</th><th>Class</th><th>Section</th><th>Roll No</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{academicRecords?.map(record => (<tr key={record._id}><td>{(record.seasonId as any)?.name}</td><td>{(record.classId as any)?.displayName}</td><td>{record.section}</td><td>{record.rollNumber || '—'}</td><td><Badge color={getStatusColor(record.status)}>{record.status}</Badge></td><td><Button size="xs" variant="subtle" onClick={() => handleEditClick(record)}><IconEdit size={14} /> Edit</Button></td></tr>))}</tbody></Table>
        </Tabs.Panel>

        <Tabs.Panel value="enrollment" pt="md">
          <Table striped><thead><tr><th>Season</th><th>Class</th><th>Section</th><th>Total Fees</th><th>Paid</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{enrollmentRecords?.map(record => (<tr key={record._id}><td>{(record.seasonId as any)?.name}</td><td>{(record.classId as any)?.displayName}</td><td>{record.section}</td><td>Rs. {record.totalFees.toLocaleString()}</td><td>Rs. {record.paidAmount.toLocaleString()}</td><td>Rs. {record.dueAmount.toLocaleString()}</td><td><Badge color={record.dueAmount > 0 ? 'red' : 'green'}>{record.dueAmount > 0 ? 'Pending' : 'Paid'}</Badge></td><td><Button size="xs" variant="light" onClick={() => { setSelectedEnrollment(record); openFeeModal(); }}>Add Payment</Button></td></tr>))}</tbody></Table>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={editModalOpen} onClose={closeEditModal} title="Edit Academic Record">
        <Select label="Class" data={classes?.map(c => ({ value: c._id, label: c.displayName })) || []} value={editForm.classId} onChange={(val) => setEditForm({ ...editForm, classId: val || '' })} required />
        <TextInput label="Section" value={editForm.section} onChange={(e) => setEditForm({ ...editForm, section: e.target.value })} mt="md" />
        <TextInput label="Roll Number" value={editForm.rollNumber} onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })} mt="md" />
        <Select label="Status" data={['active', 'promoted', 'failed', 'repeated', 'left', 'graduated']} value={editForm.status} onChange={(val) => setEditForm({ ...editForm, status: val || 'active' })} mt="md" />
        <Group justify="flex-end" mt="md"><Button variant="default" onClick={closeEditModal}>Cancel</Button><Button onClick={handleUpdateRecord}>Save</Button></Group>
      </Modal>

      <Modal opened={feeModalOpen} onClose={closeFeeModal} title="Add Payment">
        <NumberInput label="Amount" value={feeForm.paidAmount} onChange={(val) => setFeeForm({ ...feeForm, paidAmount: val || 0 })} min={0} required />
        <TextInput label="Remarks" value={feeForm.remarks} onChange={(e) => setFeeForm({ ...feeForm, remarks: e.target.value })} mt="md" />
        <Group justify="flex-end" mt="md"><Button onClick={handleAddPayment}>Record Payment</Button></Group>
      </Modal>
    </Stack>
  );
}