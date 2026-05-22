import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Select, Button, TextInput, Group, Title, Stack, Loader, Alert, 
  Paper, Divider, Grid, NumberInput, Textarea, Card, Badge, 
  Text, Modal, Radio, Tabs, MultiSelect, Checkbox
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSearch, IconUserPlus, IconSchool, IconReceipt, IconCheck } from '@tabler/icons-react';
import { DateInput } from '@mantine/dates';
import { api } from '../../lib/api';
import { AcademicSeason, Class, Student } from '../../lib/types';
import { notifications } from '@mantine/notifications';

const STATUSES = ['active', 'promoted', 'failed', 'repeated', 'left', 'graduated'];
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const RELATION_OPTIONS = ['Father', 'Mother', 'Guardian'];

export function EnrollmentPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isNewStudent, setIsNewStudent] = useState(false);
  const [activeStep, setActiveStep] = useState<'search' | 'enroll'>('search');
  
  // Enrollment form
  const [enrollForm, setEnrollForm] = useState({
    seasonId: '',
    classId: '',
    section: '',
    rollNumber: '',
    status: 'active',
    admissionFee: 0,
    tuitionFee: 0,
    examFee: 0,
    otherFees: 0,
    paidAmount: 0,
    admissionDate: new Date(),
    remarks: '',
  });

  // New student form
  const [studentForm, setStudentForm] = useState({
    name: '',
    studentId: '',
    dateOfBirth: null as Date | null,
    gender: '',
    permanentAddress: '',
    temporaryAddress: '',
    sameAddress: false,
    parents: [{ relation: 'Father', name: '', phone: '', gender: 'Male' }],
  });

  // Fetch data
  const { data: seasons } = useQuery<AcademicSeason[]>({
    queryKey: ['seasons'],
    queryFn: () => api.get('/academic-seasons').then(res => res.data),
  });

  const { data: classes } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then(res => res.data),
  });

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async () => {
      const res = await api.get(`/students/search?q=${encodeURIComponent(searchQuery)}`);
      return res.data;
    },
    onSuccess: (data) => {
      setSearchResults(data);
      if (data.length === 0 && searchQuery.length > 2) {
        notifications.show({
          title: 'No results',
          message: 'No student found. You can create a new student.',
          color: 'yellow',
        });
      }
    },
  });

  // Create new student mutation
  const createStudentMutation = useMutation({
    mutationFn: (data: any) => api.post('/students', data),
    onSuccess: (res) => {
      setSelectedStudent(res.data);
      setIsNewStudent(false);
      notifications.show({ title: 'Success', message: 'Student created', color: 'green' });
    },
  });

  // Create enrollment mutation
  const createEnrollmentMutation = useMutation({
    mutationFn: (data: any) => api.post('/academic-records', data),
    onSuccess: () => {
      notifications.show({ title: 'Success', message: 'Enrollment completed', color: 'green' });
      // Reset form
      setSelectedStudent(null);
      setSearchQuery('');
      setSearchResults([]);
      setActiveStep('search');
      setEnrollForm({
        seasonId: '', classId: '', section: '', rollNumber: '', status: 'active',
        admissionFee: 0, tuitionFee: 0, examFee: 0, otherFees: 0, paidAmount: 0,
        admissionDate: new Date(), remarks: '',
      });
    },
  });

  const handleSearch = () => {
    if (searchQuery.length >= 2) {
      searchMutation.mutate();
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setActiveStep('enroll');
  };

  const handleCreateNewStudent = () => {
    setIsNewStudent(true);
    setActiveStep('enroll');
  };

  const handleSaveStudent = () => {
    const payload = {
      ...studentForm,
      studentId: studentForm.studentId || `NEW-${Date.now()}`,
      temporaryAddress: studentForm.sameAddress ? studentForm.permanentAddress : studentForm.temporaryAddress,
    };
    createStudentMutation.mutate(payload);
  };

  const totalFees = enrollForm.admissionFee + enrollForm.tuitionFee + enrollForm.examFee + enrollForm.otherFees;
  const dueAmount = totalFees - enrollForm.paidAmount;

  return (
    <Stack p="md">
      <Title order={1}>Student Enrollment</Title>
      <Text c="dimmed" size="sm">Search for existing student or create a new one to enroll</Text>

      {activeStep === 'search' && (
        <>
          <Group grow align="flex-end">
            <TextInput
              label="Search Student"
              placeholder="Search by name, student ID, or parent phone"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} leftSection={<IconSearch size={18} />}>Search</Button>
          </Group>

          {searchMutation.isPending && <Loader />}

          {searchResults.length > 0 && (
            <Paper withBorder p="md" mt="md">
              <Title order={3}>Search Results</Title>
              <Divider my="sm" />
              {searchResults.map((student) => (
                <Card key={student._id} withBorder mb="sm" style={{ cursor: 'pointer' }} onClick={() => handleSelectStudent(student)}>
                  <Group justify="space-between">
                    <div>
                      <Text fw={500}>{student.name}</Text>
                      <Text size="sm" c="dimmed">ID: {student.studentId}</Text>
                      {student.parents?.[0] && <Text size="sm" c="dimmed">Parent: {student.parents[0].name} ({student.parents[0].phone})</Text>}
                    </div>
                    <Badge color="blue">Select</Badge>
                  </Group>
                </Card>
              ))}
            </Paper>
          )}

          <Divider label="OR" labelPosition="center" my="md" />

          <Button onClick={handleCreateNewStudent} leftSection={<IconUserPlus size={18} />} variant="outline">
            Create New Student
          </Button>
        </>
      )}

      {activeStep === 'enroll' && (
        <>
          <Group justify="space-between">
            <Button variant="subtle" onClick={() => setActiveStep('search')}>&larr; Back to Search</Button>
            {selectedStudent && <Badge size="lg" color="green">Enrolling: {selectedStudent.name}</Badge>}
          </Group>

          {isNewStudent && !selectedStudent && (
            <Paper withBorder p="md" mt="md">
              <Title order={3}>New Student Information</Title>
              <Divider my="sm" />
              <Grid>
                <Grid.Col span={6}>
                  <TextInput label="Student ID (optional)" value={studentForm.studentId} onChange={(e) => setStudentForm({...studentForm, studentId: e.target.value})} />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput label="Full Name" required value={studentForm.name} onChange={(e) => setStudentForm({...studentForm, name: e.target.value})} />
                </Grid.Col>
                <Grid.Col span={6}>
                  <DateInput label="Date of Birth" value={studentForm.dateOfBirth} onChange={(val) => setStudentForm({...studentForm, dateOfBirth: val})} />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Select label="Gender" data={GENDER_OPTIONS} value={studentForm.gender} onChange={(val) => setStudentForm({...studentForm, gender: val || ''})} />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Textarea label="Permanent Address" value={studentForm.permanentAddress} onChange={(e) => setStudentForm({...studentForm, permanentAddress: e.target.value})} />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Checkbox label="Same as permanent address" checked={studentForm.sameAddress} onChange={(e) => setStudentForm({...studentForm, sameAddress: e.currentTarget.checked})} />
                  {!studentForm.sameAddress && (
                    <Textarea label="Temporary Address" value={studentForm.temporaryAddress} onChange={(e) => setStudentForm({...studentForm, temporaryAddress: e.target.value})} mt="md" />
                  )}
                </Grid.Col>
              </Grid>

              <Title order={4} mt="md">Parents/Guardians</Title>
              {studentForm.parents.map((parent, idx) => (
                <Grid key={idx} mt="sm">
                  <Grid.Col span={3}><Select label="Relation" data={RELATION_OPTIONS} value={parent.relation} onChange={(val) => {
                    const updated = [...studentForm.parents];
                    updated[idx].relation = val || '';
                    setStudentForm({...studentForm, parents: updated});
                  }} /></Grid.Col>
                  <Grid.Col span={3}><TextInput label="Name" value={parent.name} onChange={(e) => {
                    const updated = [...studentForm.parents];
                    updated[idx].name = e.target.value;
                    setStudentForm({...studentForm, parents: updated});
                  }} /></Grid.Col>
                  <Grid.Col span={3}><TextInput label="Phone" value={parent.phone} onChange={(e) => {
                    const updated = [...studentForm.parents];
                    updated[idx].phone = e.target.value;
                    setStudentForm({...studentForm, parents: updated});
                  }} /></Grid.Col>
                  <Grid.Col span={3}><Select label="Gender" data={GENDER_OPTIONS} value={parent.gender} onChange={(val) => {
                    const updated = [...studentForm.parents];
                    updated[idx].gender = val || '';
                    setStudentForm({...studentForm, parents: updated});
                  }} /></Grid.Col>
                </Grid>
              ))}
              <Button variant="light" onClick={() => setStudentForm({...studentForm, parents: [...studentForm.parents, { relation: 'Guardian', name: '', phone: '', gender: '' }]})} mt="sm">
                + Add Parent/Guardian
              </Button>

              <Group justify="flex-end" mt="md">
                <Button onClick={handleSaveStudent} loading={createStudentMutation.isPending}>Save Student & Continue</Button>
              </Group>
            </Paper>
          )}

          {(selectedStudent || !isNewStudent) && (
            <Paper withBorder p="md" mt="md">
              <Title order={3}>Enrollment Details</Title>
              <Divider my="sm" />
              <Grid>
                <Grid.Col span={6}>
                  <Select label="Academic Season" required data={seasons?.map(s => ({ value: s._id, label: s.name })) || []} value={enrollForm.seasonId} onChange={(val) => setEnrollForm({...enrollForm, seasonId: val || ''})} />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Select label="Class" required data={classes?.map(c => ({ value: c._id, label: c.displayName })) || []} value={enrollForm.classId} onChange={(val) => setEnrollForm({...enrollForm, classId: val || ''})} />
                </Grid.Col>
                <Grid.Col span={4}>
                  <Select label="Section" data={[{ value: 'A', label: 'A' }, { value: 'B', label: 'B' }, { value: 'C', label: 'C' }]} value={enrollForm.section} onChange={(val) => setEnrollForm({...enrollForm, section: val || ''})} />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput label="Roll Number (optional)" value={enrollForm.rollNumber} onChange={(e) => setEnrollForm({...enrollForm, rollNumber: e.target.value})} />
                </Grid.Col>
                <Grid.Col span={4}>
                  <Select label="Status" data={STATUSES} value={enrollForm.status} onChange={(val) => setEnrollForm({...enrollForm, status: val || 'active'})} />
                </Grid.Col>
              </Grid>

              <Title order={4} mt="md">Fee Details</Title>
              <Grid>
                <Grid.Col span={3}>
                  <NumberInput label="Admission Fee" value={enrollForm.admissionFee} onChange={(val) => setEnrollForm({...enrollForm, admissionFee: val || 0})} min={0} />
                </Grid.Col>
                <Grid.Col span={3}>
                  <NumberInput label="Tuition Fee" value={enrollForm.tuitionFee} onChange={(val) => setEnrollForm({...enrollForm, tuitionFee: val || 0})} min={0} />
                </Grid.Col>
                <Grid.Col span={3}>
                  <NumberInput label="Exam Fee" value={enrollForm.examFee} onChange={(val) => setEnrollForm({...enrollForm, examFee: val || 0})} min={0} />
                </Grid.Col>
                <Grid.Col span={3}>
                  <NumberInput label="Other Fees" value={enrollForm.otherFees} onChange={(val) => setEnrollForm({...enrollForm, otherFees: val || 0})} min={0} />
                </Grid.Col>
                <Grid.Col span={4}>
                  <NumberInput label="Paid Amount" value={enrollForm.paidAmount} onChange={(val) => setEnrollForm({...enrollForm, paidAmount: val || 0})} min={0} />
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text fw={500}>Total Fees: Rs. {totalFees.toLocaleString()}</Text>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text fw={500} c={dueAmount > 0 ? 'red' : 'green'}>Due Amount: Rs. {dueAmount.toLocaleString()}</Text>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Textarea label="Remarks" value={enrollForm.remarks} onChange={(e) => setEnrollForm({...enrollForm, remarks: e.target.value})} />
                </Grid.Col>
              </Grid>

              <Group justify="flex-end" mt="md">
                <Button 
                  onClick={() => {
                    const studentId = selectedStudent?._id;
                    if (studentId) {
                      createEnrollmentMutation.mutate({ ...enrollForm, studentId });
                    }
                  }} 
                  loading={createEnrollmentMutation.isPending}
                  leftSection={<IconReceipt size={18} />}
                >
                  Complete Enrollment
                </Button>
              </Group>
            </Paper>
          )}
        </>
      )}
    </Stack>
  );
}