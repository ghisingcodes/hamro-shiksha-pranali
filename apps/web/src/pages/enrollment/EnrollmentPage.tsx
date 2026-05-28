import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Select, Button, TextInput, Group, Title, Stack, Loader, Alert, 
  Paper, Divider, Grid, NumberInput, Textarea, Card, Badge, 
  Text, Modal, Checkbox, Table, 
  ScrollArea} from '@mantine/core';
import { useReactToPrint } from 'react-to-print';
import { 
  IconSearch, IconUserPlus, IconReceipt, IconPrinter
  
  } from '@tabler/icons-react';
import { DateInput } from '@mantine/dates';
import { api } from '../../lib/api';
import { AcademicSeason, Class, Student } from '../../lib/types';
import { notifications } from '@mantine/notifications';
import React from 'react';

const STATUSES = ['active', 'promoted', 'failed', 'repeated', 'left', 'graduated'];
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const RELATION_OPTIONS = ['Father', 'Mother', 'Guardian'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface MonthlyFee {
  month: string;
  amount: number;
  isPaid: boolean;
  paidDate?: Date;
  paymentMethod?: string;
  transactionId?: string;
}

// Invoice Preview Component
const InvoicePreview = React.forwardRef(({ 
  student, school, enrollment, monthlyFees, totalFees, invoiceNumber 
}: any, ref: any) => {
  const currentDate = new Date().toLocaleDateString();
  
  return (
    <div ref={ref} style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: 'white' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
        <h2 style={{ margin: 0 }}>{school?.name || 'School Name'}</h2>
        <p style={{ margin: '5px 0' }}>{school?.address || 'School Address'}</p>
        <p style={{ margin: '5px 0' }}>Phone: {school?.phone || 'N/A'} | Email: {school?.email || 'N/A'}</p>
        <p style={{ margin: '5px 0' }}>PAN: {school?.panNumber || 'N/A'}</p>
      </div>

      {/* Invoice Title */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h3>ENROLLMENT INVOICE</h3>
        <p>Invoice No: {invoiceNumber} | Date: {currentDate}</p>
      </div>

      {/* Student Details */}
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Student Information</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr><td style={{ padding: '4px' }}><strong>Student Name:</strong></td><td>{student?.name}</td>
            <td style={{ padding: '4px' }}><strong>Student ID:</strong></td><td>{student?.studentId}</td></tr>
            <tr><td style={{ padding: '4px' }}><strong>Class:</strong></td><td>{enrollment?.className}</td>
            <td style={{ padding: '4px' }}><strong>Section:</strong></td><td>{enrollment?.section}</td></tr>
            <tr><td style={{ padding: '4px' }}><strong>Roll Number:</strong></td><td>{enrollment?.rollNumber || 'To be assigned'}</td>
            <td style={{ padding: '4px' }}><strong>Academic Year:</strong></td><td>{enrollment?.seasonName}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Fee Details Table */}
      <div style={{ marginBottom: '20px' }}>
        <h4>Fee Breakdown</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Description</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Amount (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}>Admission Fee</td>
            <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{enrollment?.admissionFee?.toLocaleString() || 0}</td></tr>
            {monthlyFees?.map((mf: any, idx: number) => mf.amount > 0 && (
              <tr key={idx}><td style={{ padding: '8px', border: '1px solid #ddd' }}>Monthly Fee - {mf.month}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{mf.amount.toLocaleString()}</td></tr>
            ))}
            <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}>Exam Fee</td>
            <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{enrollment?.examFee?.toLocaleString() || 0}</td></tr>
            <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}>Other Fees</td>
            <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{enrollment?.otherFees?.toLocaleString() || 0}</td></tr>
            <tr style={{ backgroundColor: '#f2f2f2', fontWeight: 'bold' }}>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>Total Amount</td>
              <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{totalFees?.toLocaleString() || 0}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payment Details */}
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Payment Details</h4>
        <table style={{ width: '100%' }}>
          <tbody>
            <tr><td style={{ padding: '4px' }}><strong>Payment Method:</strong></td><td>{enrollment?.paymentMethod || 'Not paid yet'}</td>
            <td style={{ padding: '4px' }}><strong>Payment Status:</strong></td><td>{enrollment?.paidAmount > 0 ? 'Partial Paid' : 'Pending'}</td></tr>
            {enrollment?.paidAmount > 0 && (
              <><tr><td style={{ padding: '4px' }}><strong>Paid Amount:</strong></td><td>Rs. {enrollment?.paidAmount?.toLocaleString()}</td>
              <td style={{ padding: '4px' }}><strong>Due Amount:</strong></td><td>Rs. {(totalFees - enrollment?.paidAmount)?.toLocaleString()}</td></tr></>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #ddd', fontSize: '12px' }}>
        <p>This is a computer generated invoice. Valid with authorized signature.</p>
        <p>Thank you for choosing {school?.name}</p>
      </div>
    </div>
  );
});

InvoicePreview.displayName = 'InvoicePreview';

export function EnrollmentPage() {
  const queryClient = useQueryClient();
  const printRef = useRef();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isNewStudent, setIsNewStudent] = useState(false);
  const [activeStep, setActiveStep] = useState<'search' | 'enroll'>('search');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [showInvoice, setShowInvoice] = useState(false);
  const [completedEnrollment, setCompletedEnrollment] = useState<any>(null);
  
  // Enrollment form
  const [enrollForm, setEnrollForm] = useState({
    seasonId: '',
    classId: '',
    section: '',
    rollNumber: '',
    status: 'active',
    admissionFee: 0,
    monthlyFeeAmount: 0,
    examFee: 0,
    otherFees: 0,
    paidAmount: 0,
    paymentMethod: 'cash',
    admissionDate: new Date(),
    remarks: '',
  });

  // Monthly fees
  const [monthlyFees, setMonthlyFees] = useState<MonthlyFee[]>(() => 
    MONTHS.map(month => ({ month: `${month} ${year}`, amount: 0, isPaid: false }))
  );

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

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const schoolId = user.schoolId;

  // Fetch school details
  const { data: school } = useQuery({
    queryKey: ['school', schoolId],
    queryFn: () => api.get(`/schools/${schoolId}`).then(res => res.data),
    enabled: !!schoolId,
  });

  // Update monthly fees when year changes
  useEffect(() => {
    setMonthlyFees(MONTHS.map(month => ({ month: `${month} ${year}`, amount: enrollForm.monthlyFeeAmount, isPaid: false })));
  }, [year, enrollForm.monthlyFeeAmount]);

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
        notifications.show({ title: 'No results', message: 'No student found. You can create a new student.', color: 'yellow' });
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
    mutationFn: async (data: any) => {
      // Create academic record
      const academicRecord = await api.post('/academic-records', {
        studentId: data.studentId,
        seasonId: data.seasonId,
        classId: data.classId,
        section: data.section,
        rollNumber: data.rollNumber,
        status: data.status,
      });
      
      // Calculate total fees
      const monthlyTotal = monthlyFees.reduce((sum, mf) => sum + mf.amount, 0);
      const totalFees = data.admissionFee + monthlyTotal + data.examFee + data.otherFees;
      const dueAmount = totalFees - data.paidAmount;
      
      // Create enrollment record
      const enrollmentRecord = await api.post('/enrollment-records', {
        studentId: data.studentId,
        seasonId: data.seasonId,
        classId: data.classId,
        section: data.section,
        rollNumber: data.rollNumber,
        status: data.status,
        admissionFee: data.admissionFee,
        monthlyFeeAmount: data.monthlyFeeAmount,
        examFee: data.examFee,
        otherFees: data.otherFees,
        totalFees: totalFees,
        paidAmount: data.paidAmount,
        dueAmount: dueAmount,
        paymentMethod: data.paymentMethod,
        admissionDate: data.admissionDate,
        remarks: data.remarks,
      });
      
      // Set bulk monthly fees
      if (monthlyFees.some(mf => mf.amount > 0)) {
        await api.post(`/enrollment-records/${enrollmentRecord.data._id}/bulk-monthly-fees`, {
          monthlyFees: monthlyFees.map(mf => ({ month: mf.month, amount: mf.amount, isPaid: mf.isPaid }))
        });
      }
      
      // Get class and season names for invoice
      const selectedClass = classes?.find(c => c._id === data.classId);
      const selectedSeason = seasons?.find(s => s._id === data.seasonId);
      
      return {
        academicRecord: academicRecord.data,
        enrollmentRecord: enrollmentRecord.data,
        className: selectedClass?.displayName,
        seasonName: selectedSeason?.name,
        totalFees,
        dueAmount
      };
    },
    onSuccess: (data) => {
      setCompletedEnrollment({
        ...data,
        student: selectedStudent,
        admissionFee: enrollForm.admissionFee,
        examFee: enrollForm.examFee,
        otherFees: enrollForm.otherFees,
        section: enrollForm.section,
        rollNumber: enrollForm.rollNumber,
        paidAmount: enrollForm.paidAmount,
        paymentMethod: enrollForm.paymentMethod,
      });
      setShowInvoice(true);
      notifications.show({ title: 'Success', message: 'Enrollment completed successfully!', color: 'green' });
    },
    onError: (err: any) => {
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Enrollment failed', color: 'red' });
    },
  });

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    pageStyle: '@media print { body { -webkit-print-color-adjust: exact; } }',
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

  const updateMonthlyFee = (index: number, amount: number) => {
    const updated = [...monthlyFees];
    updated[index].amount = amount;
    setMonthlyFees(updated);
  };

  const totalFees = enrollForm.admissionFee + (monthlyFees.reduce((sum, mf) => sum + mf.amount, 0)) + enrollForm.examFee + enrollForm.otherFees;
  const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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
                <Grid.Col span={6}><TextInput label="Student ID (optional)" value={studentForm.studentId} onChange={(e) => setStudentForm({...studentForm, studentId: e.target.value})} /></Grid.Col>
                <Grid.Col span={6}><TextInput label="Full Name" required value={studentForm.name} onChange={(e) => setStudentForm({...studentForm, name: e.target.value})} /></Grid.Col>
                <Grid.Col span={6}><DateInput label="Date of Birth" value={studentForm.dateOfBirth} onChange={(val) => setStudentForm({...studentForm, dateOfBirth: val})} /></Grid.Col>
                <Grid.Col span={6}><Select label="Gender" data={GENDER_OPTIONS} value={studentForm.gender} onChange={(val) => setStudentForm({...studentForm, gender: val || ''})} /></Grid.Col>
                <Grid.Col span={12}><Textarea label="Permanent Address" value={studentForm.permanentAddress} onChange={(e) => setStudentForm({...studentForm, permanentAddress: e.target.value})} /></Grid.Col>
                <Grid.Col span={12}>
                  <Checkbox label="Same as permanent address" checked={studentForm.sameAddress} onChange={(e) => setStudentForm({...studentForm, sameAddress: e.currentTarget.checked})} />
                  {!studentForm.sameAddress && <Textarea label="Temporary Address" value={studentForm.temporaryAddress} onChange={(e) => setStudentForm({...studentForm, temporaryAddress: e.target.value})} mt="md" />}
                </Grid.Col>
              </Grid>

              <Title order={4} mt="md">Parents/Guardians</Title>
              {studentForm.parents.map((parent, idx) => (
                <Grid key={idx} mt="sm">
                  <Grid.Col span={3}><Select label="Relation" data={RELATION_OPTIONS} value={parent.relation} onChange={(val) => { const updated = [...studentForm.parents]; updated[idx].relation = val || ''; setStudentForm({...studentForm, parents: updated}); }} /></Grid.Col>
                  <Grid.Col span={3}><TextInput label="Name" value={parent.name} onChange={(e) => { const updated = [...studentForm.parents]; updated[idx].name = e.target.value; setStudentForm({...studentForm, parents: updated}); }} /></Grid.Col>
                  <Grid.Col span={3}><TextInput label="Phone" value={parent.phone} onChange={(e) => { const updated = [...studentForm.parents]; updated[idx].phone = e.target.value; setStudentForm({...studentForm, parents: updated}); }} /></Grid.Col>
                  <Grid.Col span={3}><Select label="Gender" data={GENDER_OPTIONS} value={parent.gender} onChange={(val) => { const updated = [...studentForm.parents]; updated[idx].gender = val || ''; setStudentForm({...studentForm, parents: updated}); }} /></Grid.Col>
                </Grid>
              ))}
              <Button variant="light" onClick={() => setStudentForm({...studentForm, parents: [...studentForm.parents, { relation: 'Guardian', name: '', phone: '', gender: '' }]})} mt="sm">+ Add Parent/Guardian</Button>

              <Group justify="flex-end" mt="md"><Button onClick={handleSaveStudent} loading={createStudentMutation.isPending}>Save Student & Continue</Button></Group>
            </Paper>
          )}

          {(selectedStudent || !isNewStudent) && (
            <Paper withBorder p="md" mt="md">
              <Title order={3}>Enrollment Details & Fee Invoice</Title>
              <Divider my="sm" />
              <Grid>
                <Grid.Col span={6}><Select label="Academic Season" required data={seasons?.map(s => ({ value: s._id, label: s.name })) || []} value={enrollForm.seasonId} onChange={(val) => setEnrollForm({...enrollForm, seasonId: val || ''})} /></Grid.Col>
                <Grid.Col span={6}><Select label="Class" required data={classes?.map(c => ({ value: c._id, label: c.displayName })) || []} value={enrollForm.classId} onChange={(val) => setEnrollForm({...enrollForm, classId: val || ''})} /></Grid.Col>
                <Grid.Col span={4}><Select label="Section" data={[{ value: 'A', label: 'A' }, { value: 'B', label: 'B' }, { value: 'C', label: 'C' }]} value={enrollForm.section} onChange={(val) => setEnrollForm({...enrollForm, section: val || ''})} /></Grid.Col>
                <Grid.Col span={4}><TextInput label="Roll Number (optional)" value={enrollForm.rollNumber} onChange={(e) => setEnrollForm({...enrollForm, rollNumber: e.target.value})} /></Grid.Col>
                <Grid.Col span={4}><Select label="Status" data={STATUSES} value={enrollForm.status} onChange={(val) => setEnrollForm({...enrollForm, status: val || 'active'})} /></Grid.Col>
              </Grid>

              <Title order={4} mt="md">Fee Breakdown</Title>
              <Grid>
                <Grid.Col span={4}><NumberInput label="Admission Fee (Rs.)" value={enrollForm.admissionFee} onChange={(val) => setEnrollForm({...enrollForm, admissionFee: val || 0})} min={0} /></Grid.Col>
                <Grid.Col span={4}><NumberInput label="Exam Fee (Rs.)" value={enrollForm.examFee} onChange={(val) => setEnrollForm({...enrollForm, examFee: val || 0})} min={0} /></Grid.Col>
                <Grid.Col span={4}><NumberInput label="Other Fees (Rs.)" value={enrollForm.otherFees} onChange={(val) => setEnrollForm({...enrollForm, otherFees: val || 0})} min={0} /></Grid.Col>
              </Grid>

              <Title order={4} mt="md">Monthly Fees</Title>
              <Select label="Year" value={year} onChange={(val) => setYear(val || new Date().getFullYear().toString())} data={['2024', '2025', '2026', '2027'].map(y => ({ value: y, label: y }))} mb="md" />
              
              <ScrollArea style={{ height: 300 }}>
                <Table striped highlightOnHover>
                  <thead><tr><th>Month</th><th>Amount (Rs.)</th></tr></thead>
                  <tbody>
                    {monthlyFees.map((mf, idx) => (
                      <tr key={mf.month}>
                        <td>{mf.month}</td>
                        <td><NumberInput value={mf.amount} onChange={(val) => updateMonthlyFee(idx, val || 0)} min={0} style={{ width: 150 }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </ScrollArea>

              <Title order={4} mt="md">Payment Information</Title>
              <Grid>
                <Grid.Col span={4}><NumberInput label="Amount Paid (Rs.)" value={enrollForm.paidAmount} onChange={(val) => setEnrollForm({...enrollForm, paidAmount: val || 0})} min={0} /></Grid.Col>
                <Grid.Col span={4}><Select label="Payment Method" data={[{ value: 'cash', label: 'Cash' }, { value: 'bank', label: 'Bank Transfer' }, { value: 'online', label: 'Online Payment' }]} value={enrollForm.paymentMethod} onChange={(val) => setEnrollForm({...enrollForm, paymentMethod: val || 'cash'})} /></Grid.Col>
                <Grid.Col span={4}><TextInput label="Transaction ID (if any)" value={enrollForm.transactionId} onChange={(e) => setEnrollForm({...enrollForm, transactionId: e.target.value})} /></Grid.Col>
              </Grid>

              <Alert color="blue" mt="md">
                <Group justify="space-between">
                  <Text fw={500}>Total Fees: Rs. {totalFees.toLocaleString()}</Text>
                  <Text fw={500}>Paid Amount: Rs. {enrollForm.paidAmount.toLocaleString()}</Text>
                  <Text fw={500} c={totalFees - enrollForm.paidAmount > 0 ? 'red' : 'green'}>
                    Due Amount: Rs. {(totalFees - enrollForm.paidAmount).toLocaleString()}
                  </Text>
                </Group>
              </Alert>

              <Textarea label="Remarks" value={enrollForm.remarks} onChange={(e) => setEnrollForm({...enrollForm, remarks: e.target.value})} mt="md" />

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
                  size="lg"
                >
                  Generate Invoice & Complete Enrollment
                </Button>
              </Group>
            </Paper>
          )}
        </>
      )}

      {/* Invoice Modal */}
      <Modal opened={showInvoice} onClose={() => setShowInvoice(false)} size="lg" title="Enrollment Invoice" fullScreen>
        <InvoicePreview 
          ref={printRef}
          student={completedEnrollment?.student}
          school={school}
          enrollment={completedEnrollment}
          monthlyFees={monthlyFees}
          totalFees={completedEnrollment?.totalFees}
          invoiceNumber={invoiceNumber}
        />
        <Group justify="center" mt="xl">
          <Button onClick={handlePrint} leftSection={<IconPrinter size={18} />}>Print Invoice</Button>
          <Button variant="light" onClick={() => setShowInvoice(false)}>Close</Button>
        </Group>
      </Modal>
    </Stack>
  );
}