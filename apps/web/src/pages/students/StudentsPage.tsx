import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, TextInput, Select, Group, Title, Stack, Loader, Badge, Text, Divider } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconUserPlus, IconPlus, IconEye } from '@tabler/icons-react';
import { createColumnHelper, useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { api } from '../../lib/api';
import { AcademicSeason, Student, AcademicRecord, EnrollmentRecord, Class, ClassSection } from '../../lib/types';
import { notifications } from '@mantine/notifications';
import { DataTable } from '../../components/DataTable';
import { AddStudentWizardModal } from './AddStudentWizardModal';

function ParentDetailsModal({ parent, children, studentAddress, opened, onClose }) {
  const childColumnHelper = createColumnHelper<any>();
  const childColumns = [
    childColumnHelper.accessor('studentId', { header: 'Student ID' }),
    childColumnHelper.accessor('name', { header: 'Name' }),
    childColumnHelper.accessor('currentClass', { header: 'Current Class' }),
    childColumnHelper.accessor('status', { header: 'Status' }),
  ];
  const childTable = useReactTable({ data: children, columns: childColumns, getCoreRowModel: getCoreRowModel() });

  return (
    <Modal opened={opened} onClose={onClose} size="lg" title="Parent / Guardian Details">
      <Stack>
        <div>
          <Text fw={700}>{parent.relation}: {parent.name}</Text>
          <Text size="sm">📞 {parent.phone}</Text>
          <Text size="sm">✉️ {parent.email || '—'}</Text>
          <Text size="sm">💼 {parent.occupation || '—'} at {parent.workplace || '—'}</Text>
          <Text size="sm">💰 Monthly: {parent.monthlyIncome || '—'} / Yearly: {parent.yearlyIncome || '—'}</Text>
          <Text size="sm">🎓 Education: {parent.education || '—'}</Text>
          <Text size="sm">📱 Preferred contact: {parent.contactPreference || '—'}</Text>
          <Divider my="xs" />
          <Text fw={500}>Student's Address:</Text>
          <Text size="sm">🏠 Permanent: {studentAddress.permanent || '—'}</Text>
          <Text size="sm">📍 Temporary: {studentAddress.temporary || '—'}</Text>
        </div>
        <Divider />
        <Title order={5}>All Children of this Parent</Title>
        {children.length === 0 ? <Text c="dimmed">No other children registered.</Text> : <DataTable table={childTable} />}
      </Stack>
    </Modal>
  );
}

export function StudentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [parentModalOpen, setParentModalOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<any>(null);
  const [parentChildren, setParentChildren] = useState([]);
  const [currentStudentAddress, setCurrentStudentAddress] = useState({ permanent: '', temporary: '' });

  const { data: seasons } = useQuery<AcademicSeason[]>({ queryKey: ['seasons'], queryFn: () => api.get('/academic-seasons').then(res => res.data) });
  const { data: classes } = useQuery<Class[]>({ queryKey: ['classes'], queryFn: () => api.get('/classes').then(res => res.data) });
  const { data: students, refetch: refetchStudents } = useQuery<Student[]>({ queryKey: ['students'], queryFn: () => api.get('/students').then(res => res.data) });
  const { data: records, refetch: refetchRecords } = useQuery<AcademicRecord[]>({
    queryKey: ['academicRecords', selectedSeasonId],
    queryFn: () => api.get(`/academic-records?seasonId=${selectedSeasonId}`).then(res => res.data),
    enabled: !!selectedSeasonId,
  });
  const { data: classSections } = useQuery<ClassSection[]>({
    queryKey: ['classSections', selectedSeasonId],
    queryFn: () => api.get(`/class-sections?seasonId=${selectedSeasonId}`).then(res => res.data),
    enabled: !!selectedSeasonId,
  });

  const [enrollOpen, { open: openEnroll, close: closeEnroll }] = useDisclosure(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [enrollForm, setEnrollForm] = useState({ classId: '', section: '', rollNumber: '' });

  const getSectionsForClass = (classId: string) => {
    if (!classSections) return [];
    const cs = classSections.find(c => {
      const csClassId = typeof c.classId === 'string' ? c.classId : (c.classId as any)?._id;
      return csClassId === classId;
    });
    return cs?.sections.map(s => s.name) || [];
  };

  const addEnrollmentMutation = useMutation({
    mutationFn: (data: any) => api.post('/academic-records', { ...data, seasonId: selectedSeasonId }),
    onSuccess: () => { refetchRecords(); closeEnroll(); notifications.show({ title: 'Success', message: 'Enrollment added', color: 'green' }); },
  });

  const handleEnroll = () => addEnrollmentMutation.mutate({ studentId: selectedStudentId, ...enrollForm });

  const getEnrollment = (studentId: string) => records?.find(r => (typeof r.studentId === 'string' ? r.studentId : r.studentId._id) === studentId);

  const [wizardOpen, { open: openWizard, close: closeWizard }] = useDisclosure(false);
  const studentCount = students?.length || 0;

  const handleParentClick = async (parent: any, student: Student) => {
    setCurrentStudentAddress({
      permanent: student.permanentAddress || '—',
      temporary: student.temporaryAddress || (student.sameAddress ? student.permanentAddress : '—'),
    });
    const res = await api.get(`/students/parent-children?phone=${encodeURIComponent(parent.phone)}`);
    const enriched = res.data.map((child: any) => ({
      ...child,
      currentClass: getEnrollment(child._id) ? (getEnrollment(child._id)?.classId as any)?.displayName : 'Not enrolled',
      status: getEnrollment(child._id)?.status || 'Not enrolled',
    }));
    setParentChildren(enriched);
    setSelectedParent(parent);
    setParentModalOpen(true);
  };

  const studentColumnHelper = createColumnHelper<Student>();
  const studentColumns = [
    studentColumnHelper.accessor('studentId', { header: 'Student ID' }),
    studentColumnHelper.accessor('name', { header: 'Name' }),
    studentColumnHelper.display({
      id: 'parents',
      header: 'Parents (Name, Relation, Contact)',
      cell: ({ row }) => (
        <Stack gap={4}>
          {row.original.parents?.map((p, idx) => (
            <Group key={idx} gap={4}>
              <Badge>{p.relation}</Badge>
              <Button variant="subtle" size="xs" onClick={() => handleParentClick(p, row.original)}>{p.name}</Button>
              <Text size="xs" c="dimmed">{p.phone}</Text>
            </Group>
          ))}
        </Stack>
      ),
    }),
    studentColumnHelper.display({
      id: 'enrollment',
      header: 'Current Enrollment',
      cell: ({ row }) => {
        const enrollment = getEnrollment(row.original._id);
        if (!selectedSeasonId) return 'Select season to view';
        if (!enrollment) return 'Not enrolled';
        return `${(enrollment.classId as any)?.displayName} - ${enrollment.section} (Roll: ${enrollment.rollNumber || '—'})`;
      },
    }),
    studentColumnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Group gap="xs">
          <Button size="xs" variant="light" onClick={() => { setSelectedStudentId(row.original._id); openEnroll(); }} disabled={!selectedSeasonId}><IconPlus size={14} /> Enroll</Button>
          <Button size="xs" variant="subtle" onClick={() => navigate(`/students/${row.original._id}`)}><IconEye size={14} /> View Details</Button>
        </Group>
      ),
    }),
  ];

  const studentTable = useReactTable({ data: students || [], columns: studentColumns, getCoreRowModel: getCoreRowModel() });

  return (
    <Stack p="md">
      <Title order={1}>Student Management</Title>
      <Group justify="space-between">
        <Select label="Academic Season" placeholder="Select season" data={seasons?.map(s => ({ value: s._id, label: s.name })) || []} value={selectedSeasonId} onChange={setSelectedSeasonId} clearable style={{ width: 300 }} />
        <Button leftSection={<IconUserPlus size={18} />} onClick={openWizard}>Add New Student</Button>
      </Group>
      {!students ? <Loader /> : <DataTable table={studentTable} />}
      <AddStudentWizardModal opened={wizardOpen} onClose={closeWizard} onSuccess={(newStudentId) => { refetchStudents(); if (selectedSeasonId) { setSelectedStudentId(newStudentId); openEnroll(); } }} existingStudentCount={studentCount} />
      <Modal opened={enrollOpen} onClose={closeEnroll} title="Enroll in Season">
        <Select label="Class" data={classes?.map(c => ({ value: c._id, label: c.displayName })) || []} value={enrollForm.classId} onChange={(val) => { setEnrollForm({ ...enrollForm, classId: val || '', section: '' }); }} required />
        <Select label="Section (optional)" data={getSectionsForClass(enrollForm.classId).map(sec => ({ value: sec, label: sec }))} value={enrollForm.section} onChange={(val) => setEnrollForm({ ...enrollForm, section: val || '' })} disabled={!enrollForm.classId} clearable />
        <TextInput label="Roll Number (optional)" value={enrollForm.rollNumber} onChange={e => setEnrollForm({ ...enrollForm, rollNumber: e.target.value })} />
        <Group justify="flex-end" mt="md"><Button onClick={handleEnroll}>Enroll</Button></Group>
      </Modal>
      {selectedParent && <ParentDetailsModal parent={selectedParent} children={parentChildren} studentAddress={currentStudentAddress} opened={parentModalOpen} onClose={() => setParentModalOpen(false)} />}
    </Stack>
  );
}