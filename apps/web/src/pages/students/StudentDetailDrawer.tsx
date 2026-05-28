import { useQuery } from '@tanstack/react-query';
import {
  Drawer, Stack, Card, Group, Avatar, Title, Badge, Grid, Text,
  Tabs, SimpleGrid, Paper, Divider, ScrollArea, Table as MantineTable,
  Loader, Alert
} from '@mantine/core';
import {
  IconCalendar, IconGenderBigender, IconUsers, IconId, IconPhone,
  IconMail, IconBriefcase, IconMapPin, IconCurrencyRupee, IconSchool,
  IconHeart, IconBrain, IconDeviceMobile, IconWifi, IconReceipt,
  IconDroplet
} from '@tabler/icons-react';
import { api } from '../../lib/api';
import { Student, AcademicRecord, EnrollmentRecord } from '../../lib/types';

interface StudentDetailDrawerProps {
  opened: boolean;
  onClose: () => void;
  student: Student | null;
  selectedSeasonId?: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'green',
  promoted: 'blue',
  failed: 'red',
  repeated: 'orange',
  left: 'gray',
  graduated: 'teal',
};

const STATUS_LABELS: Record<string, string> = {
  active: '✅ Active',
  promoted: '📈 Promoted',
  failed: '❌ Failed',
  repeated: '🔄 Repeated',
  left: '🚪 Left',
  graduated: '🎓 Graduated',
};

export function StudentDetailDrawer({ opened, onClose, student, selectedSeasonId }: StudentDetailDrawerProps) {
  // Fetch academic records for this student
  const { data: academicRecords, isLoading: academicLoading } = useQuery<AcademicRecord[]>({
    queryKey: ['academicRecords', student?._id],
    queryFn: () => api.get(`/academic-records?studentId=${student?._id}`).then(res => res.data),
    enabled: !!student?._id && opened,
  });

  // Fetch enrollment records for this student
  const { data: enrollmentRecords, isLoading: enrollmentLoading } = useQuery<EnrollmentRecord[]>({
    queryKey: ['enrollmentRecords', student?._id],
    queryFn: () => api.get(`/enrollment-records?studentId=${student?._id}`).then(res => res.data),
    enabled: !!student?._id && opened,
  });

  if (!student) return null;

  // Get enrollment for selected season
  const currentEnrollment = enrollmentRecords?.find(
    e => (typeof e.seasonId === 'string' ? e.seasonId : e.seasonId?._id) === selectedSeasonId
  );

  // Calculate total paid months
  const paidMonths = currentEnrollment?.monthlyFees?.filter((mf: any) => mf.isPaid).length || 0;
  const totalMonths = currentEnrollment?.monthlyFees?.length || 12;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title="Student Details"
      position="right"
      size="xl"
      padding="md"
    >
      <ScrollArea style={{ height: 'calc(100vh - 80px)' }}>
        <Stack gap="md">
          {/* Header with Avatar */}
          <Card withBorder radius="md" p="md">
            <Group wrap="nowrap">
              <Avatar size={80} radius="xl" color="blue">
                {student.name?.charAt(0)}
              </Avatar>
              <div style={{ flex: 1 }}>
                <Title order={3}>{student.name}</Title>
                <Group gap="xs" mt={4}>
                  <Badge size="lg" variant="filled" color="blue">{student.studentId}</Badge>
                  {currentEnrollment && (
                    <Badge size="lg" variant="light" color={STATUS_COLORS[currentEnrollment.status]}>
                      {STATUS_LABELS[currentEnrollment.status]}
                    </Badge>
                  )}
                  {student.bloodGroup && (
                    <Badge size="lg" variant="light" color="violet">
                      🩸 {student.bloodGroup}
                    </Badge>
                  )}
                </Group>
              </div>
            </Group>
          </Card>

          {/* Quick Stats */}
          <SimpleGrid cols={4} spacing="md">
            <Paper withBorder p="sm" radius="md" ta="center">
              <IconCalendar size={24} color="blue" style={{ marginBottom: 8 }} />
              <Text fw={600} size="sm">Age</Text>
              <Text size="lg">{student.dateOfBirth ? new Date().getFullYear() - new Date(student.dateOfBirth).getFullYear() : '—'} yrs</Text>
            </Paper>
            <Paper withBorder p="sm" radius="md" ta="center">
              <IconGenderBigender size={24} color="green" style={{ marginBottom: 8 }} />
              <Text fw={600} size="sm">Gender</Text>
              <Text size="lg">{student.gender || '—'}</Text>
            </Paper>
            <Paper withBorder p="sm" radius="md" ta="center">
              <IconUsers size={24} color="orange" style={{ marginBottom: 8 }} />
              <Text fw={600} size="sm">Parents</Text>
              <Text size="lg">{student.parents?.length || 0}</Text>
            </Paper>
            <Paper withBorder p="sm" radius="md" ta="center">
              <IconReceipt size={24} color="teal" style={{ marginBottom: 8 }} />
              <Text fw={600} size="sm">Fees Paid</Text>
              <Text size="lg">{paidMonths}/{totalMonths} months</Text>
            </Paper>
          </SimpleGrid>

          {/* Tabs for different sections */}
          <Tabs defaultValue="personal">
            <Tabs.List grow>
              <Tabs.Tab value="personal" leftSection={<IconId size={14} />}>Personal</Tabs.Tab>
              <Tabs.Tab value="parents" leftSection={<IconUsers size={14} />}>Parents ({student.parents?.length || 0})</Tabs.Tab>
              <Tabs.Tab value="health" leftSection={<IconHeart size={14} />}>Health</Tabs.Tab>
              <Tabs.Tab value="academic" leftSection={<IconSchool size={14} />}>Academic History</Tabs.Tab>
              <Tabs.Tab value="fees" leftSection={<IconReceipt size={14} />}>Fee Details</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="personal" pt="md">
              <Card withBorder radius="md">
                <Grid>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">Student ID</Text>
                    <Text fw={500}>{student.studentId}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">Full Name</Text>
                    <Text fw={500}>{student.name}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">Date of Birth</Text>
                    <Text fw={500}>{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '—'}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">Gender</Text>
                    <Text fw={500}>{student.gender || '—'}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">Blood Group</Text>
                    <Text fw={500}>{student.bloodGroup || '—'}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">Lives with</Text>
                    <Text fw={500}>{student.liveWith || '—'}</Text>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Text size="sm" c="dimmed">Permanent Address</Text>
                    <Text fw={500}>{student.permanentAddress || '—'}</Text>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Text size="sm" c="dimmed">Temporary Address</Text>
                    <Text fw={500}>{student.temporaryAddress || student.permanentAddress || '—'}</Text>
                  </Grid.Col>
                </Grid>
              </Card>
            </Tabs.Panel>

            <Tabs.Panel value="parents" pt="md">
              <Stack>
                {student.parents?.map((parent, idx) => (
                  <Card key={idx} withBorder radius="md" p="md">
                    <Group justify="space-between" mb="sm">
                      <Group>
                        <Avatar size="md" radius="xl" color={parent.isPrimary ? 'blue' : 'gray'}>
                          {parent.name?.charAt(0)}
                        </Avatar>
                        <div>
                          <Text fw={600}>{parent.relation}: {parent.name}</Text>
                          {parent.isPrimary && <Badge size="xs" color="blue">Primary</Badge>}
                        </div>
                      </Group>
                    </Group>
                    <Divider mb="sm" />
                    <Grid>
                      <Grid.Col span={6}>
                        <Group gap="xs"><IconPhone size={14} /><Text size="sm">{parent.phone}</Text></Group>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Group gap="xs"><IconMail size={14} /><Text size="sm">{parent.email || '—'}</Text></Group>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Group gap="xs"><IconBriefcase size={14} /><Text size="sm">{parent.occupation || '—'} at {parent.workplace || '—'}</Text></Group>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Group gap="xs"><IconCurrencyRupee size={14} /><Text size="sm">Monthly: ₹{parent.monthlyIncome?.toLocaleString() || '—'}</Text></Group>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Group gap="xs"><IconDroplet size={14} /><Text size="sm">Blood Group: {parent.bloodGroup || '—'}</Text></Group>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Group gap="xs"><IconSchool size={14} /><Text size="sm">Education: {parent.education || '—'}</Text></Group>
                      </Grid.Col>
                    </Grid>
                  </Card>
                ))}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="health" pt="md">
              <Card withBorder radius="md">
                <Stack>
                  <div>
                    <Group mb="xs"><IconHeart size={18} color="red" /><Text fw={600}>Long-term Health Problems</Text></Group>
                    <Group gap="xs">
                      {student.longTermHealth?.length ? (
                        student.longTermHealth.map(h => <Badge key={h} color="red" variant="light">{h}</Badge>)
                      ) : <Text c="dimmed">No health issues reported</Text>}
                    </Group>
                  </div>
                  <div>
                    <Group mb="xs"><IconBrain size={18} color="orange" /><Text fw={600}>Abnormal Behaviours</Text></Group>
                    <Group gap="xs">
                      {student.abnormalBehaviour?.length ? (
                        student.abnormalBehaviour.map(b => <Badge key={b} color="orange" variant="light">{b}</Badge>)
                      ) : <Text c="dimmed">No behavioural issues reported</Text>}
                    </Group>
                  </div>
                  <div>
                    <Group mb="xs"><IconDeviceMobile size={18} color="blue" /><Text fw={600}>Mobile Access</Text></Group>
                    <Badge color={student.mobileAccess === 'Yes' ? 'green' : 'red'} variant="light">
                      {student.mobileAccess || 'Not specified'}
                    </Badge>
                  </div>
                  <div>
                    <Group mb="xs"><IconWifi size={18} color="teal" /><Text fw={600}>Internet Access</Text></Group>
                    <Badge color={student.internetAccess?.includes('Yes') ? 'green' : 'red'} variant="light">
                      {student.internetAccess || 'Not specified'}
                    </Badge>
                  </div>
                </Stack>
              </Card>
            </Tabs.Panel>

            <Tabs.Panel value="academic" pt="md">
              <Card withBorder radius="md">
                <Title order={5} mb="md">Academic History</Title>
                {academicLoading ? (
                  <Loader size="sm" />
                ) : !academicRecords?.length ? (
                  <Text c="dimmed" ta="center">No academic records found.</Text>
                ) : (
                  <MantineTable striped highlightOnHover>
                    <thead>
                      <tr><th>Season</th><th>Class</th><th>Section</th><th>Roll No</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {academicRecords.map(record => (
                        <tr key={record._id}>
                          <td>{(record.seasonId as any)?.name || 'N/A'}</td>
                          <td>{(record.classId as any)?.displayName || 'N/A'}</td>
                          <td>{record.section}</td>
                          <td>{record.rollNumber || '—'}</td>
                          <td><Badge color={STATUS_COLORS[record.status]}>{record.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </MantineTable>
                )}
              </Card>
            </Tabs.Panel>

            <Tabs.Panel value="fees" pt="md">
              <Card withBorder radius="md">
                <Title order={5} mb="md">Fee Details - Current Season</Title>
                {enrollmentLoading ? (
                  <Loader size="sm" />
                ) : !currentEnrollment ? (
                  <Alert color="blue" title="No Enrollment">
                    No enrollment record found for the selected season.
                  </Alert>
                ) : (
                  <Stack>
                    <SimpleGrid cols={3} spacing="md">
                      <Paper p="sm" withBorder>
                        <Text size="xs" c="dimmed">Admission Fee</Text>
                        <Text fw={600}>₹{currentEnrollment.admissionFee?.toLocaleString() || 0}</Text>
                      </Paper>
                      <Paper p="sm" withBorder>
                        <Text size="xs" c="dimmed">Monthly Fee</Text>
                        <Text fw={600}>₹{currentEnrollment.monthlyFeeAmount?.toLocaleString() || 0}/month</Text>
                      </Paper>
                      <Paper p="sm" withBorder>
                        <Text size="xs" c="dimmed">Exam Fee</Text>
                        <Text fw={600}>₹{currentEnrollment.examFee?.toLocaleString() || 0}</Text>
                      </Paper>
                      <Paper p="sm" withBorder>
                        <Text size="xs" c="dimmed">Other Fees</Text>
                        <Text fw={600}>₹{currentEnrollment.otherFees?.toLocaleString() || 0}</Text>
                      </Paper>
                      <Paper p="sm" withBorder bg="green.0">
                        <Text size="xs" c="dimmed">Total Fees</Text>
                        <Text fw={600} c="green">₹{currentEnrollment.totalFees?.toLocaleString() || 0}</Text>
                      </Paper>
                      <Paper p="sm" withBorder bg="orange.0">
                        <Text size="xs" c="dimmed">Due Amount</Text>
                        <Text fw={600} c="orange">₹{currentEnrollment.totalDue?.toLocaleString() || 0}</Text>
                      </Paper>
                    </SimpleGrid>

                    <Divider label="Monthly Fee Details" labelPosition="center" />
                    
                    <MantineTable striped highlightOnHover>
                      <thead>
                        <tr><th>Month</th><th>Amount</th><th>Status</th><th>Payment Date</th></tr>
                      </thead>
                      <tbody>
                        {currentEnrollment.monthlyFees?.map((mf: any, idx: number) => (
                          <tr key={idx}>
                            <td>{mf.month}</td>
                            <td>₹{mf.amount?.toLocaleString()}</td>
                            <td>
                              {mf.isPaid ? (
                                <Badge color="green">✅ Paid</Badge>
                              ) : (
                                <Badge color="red">❌ Pending</Badge>
                              )}
                            </td>
                            <td>{mf.paidDate ? new Date(mf.paidDate).toLocaleDateString() : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </MantineTable>
                    
                    <Alert color="blue" mt="md">
                      Total Paid: ₹{currentEnrollment.totalPaid?.toLocaleString() || 0} | 
                      Due: ₹{currentEnrollment.totalDue?.toLocaleString() || 0}
                    </Alert>
                  </Stack>
                )}
              </Card>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </ScrollArea>
    </Drawer>
  );
}