import { useState } from 'react';
import {useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Stack, Title, Text, Paper, Grid, Group, Badge, 
  Card, Divider, Skeleton, ThemeIcon, SimpleGrid, 
  Button, Alert, Table, 
  RingProgress, Center, Loader, Tabs, Select
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { 
  IconUsers, IconChecklist, 
  IconClock, IconChartBar, IconSchool,
  IconUserCheck, IconUserX, 
  IconActivity, 
  IconAlertCircle, IconHeartbeat, IconBrush
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../../../lib/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_MAP = { M: 'Mon', T: 'Tue', W: 'Wed', Th: 'Thu', F: 'Fri' };

// Export name matches the import in app.tsx
export function TeacherDashboard() {
  const queryClient = useQueryClient();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const schoolSlug = localStorage.getItem('schoolSlug');
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('overview');

  // Fetch current season
  const { data: seasons } = useQuery({
    queryKey: ['seasons'],
    queryFn: () => api.get('/academic-seasons').then(res => res.data),
  });

  const activeSeason = seasons?.find(s => s.isActive);

  // Fetch teacher's complete routine
  const { data: teacherRoutine, isLoading: routineLoading } = useQuery({
    queryKey: ['teacherCompleteRoutine', user.teacherId, activeSeason?._id],
    queryFn: async () => {
      const response = await api.get(`/teacher-routine/teacher/${user.teacherId}/complete`, {
        params: { seasonId: activeSeason?._id }
      });
      return response.data;
    },
    enabled: !!user.teacherId && !!activeSeason?._id,
  });

  // Fetch daily attendance report
  const { data: attendanceReport, isLoading: attendanceLoading } = useQuery({
    queryKey: ['dailyAttendanceReport', user.teacherId, selectedDate.toISOString().split('T')[0]],
    queryFn: async () => {
      const response = await api.get(`/teacher-reports/daily-attendance`, {
        params: {
          teacherId: user.teacherId,
          date: selectedDate.toISOString().split('T')[0],
        }
      });
      return response.data;
    },
    enabled: !!user.teacherId,
  });

  // Fetch period activity report
  const { data: periodActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['periodActivityReport', user.teacherId, selectedDate.toISOString().split('T')[0], selectedPeriod],
    queryFn: async () => {
      if (!selectedPeriod) return null;
      const response = await api.get(`/teacher-reports/period-activity`, {
        params: {
          teacherId: user.teacherId,
          date: selectedDate.toISOString().split('T')[0],
          period: selectedPeriod,
        }
      });
      return response.data;
    },
    enabled: !!user.teacherId && !!selectedPeriod,
  });

  const currentDay = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dayLetter = currentDay.slice(0, 2) === 'Mo' ? 'M' : 
                    currentDay.slice(0, 2) === 'Tu' ? 'T' :
                    currentDay.slice(0, 2) === 'We' ? 'W' :
                    currentDay.slice(0, 2) === 'Th' ? 'Th' : 'F';

  // Today's classes for the teacher
  const todayClasses = teacherRoutine?.personalRoutine?.assignments?.filter(
    (a: any) => a.days.includes(dayLetter)
  ) || [];

  const attendanceRate = attendanceReport?.summary?.attendanceRate || 0;
  const attendanceColor = attendanceRate >= 75 ? 'green' : attendanceRate >= 50 ? 'orange' : 'red';

  return (
    <Stack p="md" gap="lg">
      {/* Welcome Section */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Paper withBorder p="lg" radius="md" style={{ background: 'linear-gradient(135deg, #1e5a7a 0%, #0e3a52 100%)' }}>
          <Group justify="space-between" align="flex-start">
            <div>
              <Text size="sm" c="white" opacity={0.8}>Welcome back,</Text>
              <Title order={1} c="white" mt={4}>{user.name || 'Teacher'}</Title>
              <Text c="white" opacity={0.8} mt={4}>{user.email}</Text>
              <Group mt="sm">
                {teacherRoutine?.classTeacherRoutines?.length > 0 ? (
                  <Badge size="lg" color="yellow" variant="light">👩‍🏫 Class Teacher</Badge>
                ) : (
                  <Badge size="lg" color="cyan" variant="light">📚 Subject Teacher</Badge>
                )}
                <Badge size="lg" color="teal" variant="light">{teacherRoutine?.personalRoutine?.assignments?.length || 0} Classes</Badge>
              </Group>
            </div>
            <ThemeIcon size={80} radius="xl" variant="light" color="white" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <IconUsers size={40} />
            </ThemeIcon>
          </Group>
        </Paper>
      </motion.div>

      {/* Date Selector */}
      <Card withBorder shadow="sm" p="md" radius="md">
        <Group justify="space-between">
          <DatePickerInput
            value={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            label="Select Date"
            placeholder="Pick a date"
            style={{ width: 200 }}
          />
          <Group>
            <Text size="sm" c="dimmed">{currentDay}</Text>
            <Badge color="blue">{selectedDate.toLocaleDateString()}</Badge>
          </Group>
        </Group>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconChartBar size={16} />}>Overview</Tabs.Tab>
          <Tabs.Tab value="classTeacher" leftSection={<IconSchool size={16} />}>Class Teacher Routine</Tabs.Tab>
          <Tabs.Tab value="mySchedule" leftSection={<IconClock size={16} />}>My Schedule</Tabs.Tab>
          <Tabs.Tab value="attendance" leftSection={<IconChecklist size={16} />}>Attendance Report</Tabs.Tab>
          <Tabs.Tab value="healthHygiene" leftSection={<IconHeartbeat size={16} />}>Health & Hygiene</Tabs.Tab>
          <Tabs.Tab value="activities" leftSection={<IconActivity size={16} />}>Period Activities</Tabs.Tab>
        </Tabs.List>

        {/* Overview Tab */}
        <Tabs.Panel value="overview" pt="md">
          <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md">
            <Card withBorder p="md">
              <Group>
                <ThemeIcon size="lg" color="blue" variant="light"><IconUsers size={20} /></ThemeIcon>
                <div>
                  <Text size="xl" fw={700}>{attendanceReport?.summary?.total || 0}</Text>
                  <Text size="xs" c="dimmed">Total Students</Text>
                </div>
              </Group>
            </Card>
            <Card withBorder p="md">
              <Group>
                <ThemeIcon size="lg" color="green" variant="light"><IconUserCheck size={20} /></ThemeIcon>
                <div>
                  <Text size="xl" fw={700} c="green">{attendanceReport?.summary?.present || 0}</Text>
                  <Text size="xs" c="dimmed">Present Today</Text>
                </div>
              </Group>
            </Card>
            <Card withBorder p="md">
              <Group>
                <ThemeIcon size="lg" color="red" variant="light"><IconUserX size={20} /></ThemeIcon>
                <div>
                  <Text size="xl" fw={700} c="red">{attendanceReport?.summary?.absent || 0}</Text>
                  <Text size="xs" c="dimmed">Absent Today</Text>
                </div>
              </Group>
            </Card>
            <Card withBorder p="md">
              <Group>
                <ThemeIcon size="lg" color="orange" variant="light"><IconClock size={20} /></ThemeIcon>
                <div>
                  <Text size="xl" fw={700}>{attendanceReport?.summary?.late || 0}</Text>
                  <Text size="xs" c="dimmed">Late Arrivals</Text>
                </div>
              </Group>
            </Card>
          </SimpleGrid>

          <Grid mt="md">
            <Grid.Col span={6}>
              <Card withBorder p="md">
                <Text fw={600} mb="md">Attendance Rate</Text>
                <RingProgress
                  size={150}
                  thickness={12}
                  roundCaps
                  sections={[{ value: parseFloat(attendanceRate), color: attendanceColor }]}
                  label={
                    <Center>
                      <Text size="xl" fw={700}>{attendanceRate}%</Text>
                    </Center>
                  }
                />
              </Card>
            </Grid.Col>
            <Grid.Col span={6}>
              <Card withBorder p="md">
                <Text fw={600} mb="md">Today's Classes</Text>
                {todayClasses.length > 0 ? (
                  <Stack gap="sm">
                    {todayClasses.map((cls, idx) => (
                      <Group key={idx} justify="space-between">
                        <Group>
                          <Badge color="blue">Period {cls.period}</Badge>
                          <Text>{cls.className} - {cls.section}</Text>
                        </Group>
                        <Text size="sm" c="dimmed">{cls.subject}</Text>
                      </Group>
                    ))}
                  </Stack>
                ) : (
                  <Text c="dimmed">No classes today</Text>
                )}
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        {/* Class Teacher Routine Tab */}
        <Tabs.Panel value="classTeacher" pt="md">
          {routineLoading ? <Skeleton height={200} /> : teacherRoutine?.classTeacherRoutines?.length === 0 ? (
            <Alert color="blue">You are not assigned as a class teacher for any section.</Alert>
          ) : (
            teacherRoutine?.classTeacherRoutines?.map((routine: any, idx: number) => (
              <Card key={idx} withBorder p="md" radius="md" mb="md">
                <Title order={3}>{routine.className} - Section {routine.section}</Title>
                <Divider my="md" />
                <div style={{ overflowX: 'auto' }}>
                  <Table striped highlightOnHover>
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>Subject</th>
                        <th>Teacher</th>
                        <th>Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {routine.periods.map((period: any, pIdx: number) => (
                        <tr key={pIdx}>
                          <td style={{ fontWeight: 'bold' }}>Period {period.period}</td>
                          <td>{period.subject || '—'}</td>
                          <td>{period.teacher || '—'}</td>
                          <td>{period.days?.map((d: string) => DAY_MAP[d]).join(', ') || 'All days'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card>
            ))
          )}
        </Tabs.Panel>

        {/* My Schedule Tab */}
        <Tabs.Panel value="mySchedule" pt="md">
          <Card withBorder p="md" radius="md">
            <Title order={3}>Your Teaching Schedule</Title>
            <Divider my="md" />
            <div style={{ overflowX: 'auto' }}>
              <Table striped highlightOnHover>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Subject</th>
                    <th>Days</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherRoutine?.personalRoutine?.assignments?.map((assignment: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 'bold' }}>Period {assignment.period}</td>
                      <td>{assignment.className}</td>
                      <td>{assignment.section}</td>
                      <td>{assignment.subject}</td>
                      <td>{assignment.days.map((d: string) => DAY_MAP[d]).join(', ')}</td>
                      <td>
                        <Button 
                          size="xs" 
                          variant="light" 
                          color="teal"
                          component={Link}
                          to={`/${schoolSlug}/teacher/activities?classId=${assignment.classId}&section=${assignment.section}&period=${assignment.period}`}
                        >
                          Record Activity
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>
        </Tabs.Panel>

        {/* Attendance Report Tab */}
        <Tabs.Panel value="attendance" pt="md">
          <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md" mb="md">
            <Card withBorder p="sm">
              <Text ta="center" size="sm" c="dimmed">Total Students</Text>
              <Text ta="center" fw={700} size="xl">{attendanceReport?.summary?.total || 0}</Text>
            </Card>
            <Card withBorder p="sm" bg="green.0">
              <Text ta="center" size="sm" c="dimmed">✅ Present</Text>
              <Text ta="center" fw={700} size="xl" c="green">{attendanceReport?.summary?.present || 0}</Text>
            </Card>
            <Card withBorder p="sm" bg="red.0">
              <Text ta="center" size="sm" c="dimmed">❌ Absent</Text>
              <Text ta="center" fw={700} size="xl" c="red">{attendanceReport?.summary?.absent || 0}</Text>
            </Card>
            <Card withBorder p="sm" bg="orange.0">
              <Text ta="center" size="sm" c="dimmed">⏰ Late</Text>
              <Text ta="center" fw={700} size="xl" c="orange">{attendanceReport?.summary?.late || 0}</Text>
            </Card>
          </SimpleGrid>

          {attendanceReport?.absentStudents?.length > 0 && (
            <Card withBorder p="md" radius="md" mb="md" bg="red.0">
              <Group mb="md">
                <IconUserX size={20} color="red" />
                <Title order={4}>Absent Students ({attendanceReport.absentStudents.length})</Title>
              </Group>
              <Divider mb="md" />
              <Table>
                <thead><tr><th>Roll No</th><th>Name</th><th>Reason</th><th>Remarks</th></tr></thead>
                <tbody>
                  {attendanceReport.absentStudents.map((student: any) => (
                    <tr key={student.id}>
                      <td>{student.rollNumber}</td>
                      <td>{student.name}</td>
                      <td>{student.reason || '—'}</td>
                      <td>{student.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}
        </Tabs.Panel>

        {/* Health & Hygiene Tab */}
        <Tabs.Panel value="healthHygiene" pt="md">
          <Card withBorder p="md" radius="md" mb="md">
            <Group mb="md">
              <IconHeartbeat size={20} color="red" />
              <Title order={4}>Health Issues</Title>
            </Group>
            <Divider mb="md" />
            {attendanceReport?.healthIssues?.length === 0 ? (
              <Text c="dimmed">No health issues reported today.</Text>
            ) : (
              <Table>
                <thead><tr><th>Roll No</th><th>Name</th><th>Issues</th><th>Remarks</th></tr></thead>
                <tbody>
                  {attendanceReport?.healthIssues?.map((student: any) => (
                    <tr key={student.id}>
                      <td>{student.rollNumber}</td>
                      <td>{student.name}</td>
                      <td>{student.issues?.join(', ') || '—'}</td>
                      <td>{student.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          <Card withBorder p="md" radius="md">
            <Group mb="md">
              <IconBrush size={20} color="green" />
              <Title order={4}>Hygiene Issues</Title>
            </Group>
            <Divider mb="md" />
            {attendanceReport?.attendance?.filter((a: any) => a.hygieneIssues?.length > 0).length === 0 ? (
              <Text c="dimmed">No hygiene issues reported today.</Text>
            ) : (
              <Table>
                <thead><tr><th>Roll No</th><th>Name</th><th>Hygiene Issues</th><th>Remarks</th></tr></thead>
                <tbody>
                  {attendanceReport?.attendance?.filter((a: any) => a.hygieneIssues?.length > 0).map((record: any) => (
                    <tr key={record.studentId?._id}>
                      <td>{record.studentId?.rollNumber}</td>
                      <td>{record.studentId?.name}</td>
                      <td>{record.hygieneIssues?.join(', ') || '—'}</td>
                      <td>{record.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </Tabs.Panel>

        {/* Period Activities Tab */}
        <Tabs.Panel value="activities" pt="md">
          <Group mb="md">
            <Select
              label="Select Period"
              placeholder="Choose period"
              data={Array.from({ length: 7 }, (_, i) => ({ value: (i + 1).toString(), label: `Period ${i + 1}` }))}
              value={selectedPeriod?.toString()}
              onChange={(val) => setSelectedPeriod(val ? parseInt(val) : null)}
              style={{ width: 150 }}
            />
          </Group>

          {activityLoading && <Loader />}
          {selectedPeriod && periodActivity && (
            <>
              <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md" mb="md">
                <Card withBorder p="sm">
                  <Text ta="center" size="sm">Homework Complete</Text>
                  <Text ta="center" fw={700} size="xl" c="green">{periodActivity.summary?.homeworkComplete || 0}</Text>
                </Card>
                <Card withBorder p="sm">
                  <Text ta="center" size="sm">Classwork Complete</Text>
                  <Text ta="center" fw={700} size="xl" c="blue">{periodActivity.summary?.classworkComplete || 0}</Text>
                </Card>
                <Card withBorder p="sm">
                  <Text ta="center" size="sm">Discipline Good</Text>
                  <Text ta="center" fw={700} size="xl" c="teal">{periodActivity.summary?.disciplineGood || 0}</Text>
                </Card>
                <Card withBorder p="sm">
                  <Text ta="center" size="sm">Health Good</Text>
                  <Text ta="center" fw={700} size="xl" c="orange">{periodActivity.summary?.healthGood || 0}</Text>
                </Card>
              </SimpleGrid>

              {periodActivity.studentsWithIssues?.length > 0 && (
                <Card withBorder p="md" radius="md">
                  <Group mb="md">
                    <IconAlertCircle size={20} color="orange" />
                    <Title order={4}>Students Needing Attention</Title>
                  </Group>
                  <Divider mb="md" />
                  <Table>
                    <thead>
                      <tr><th>Roll No</th><th>Name</th><th>Health</th><th>Discipline</th><th>Homework</th><th>Classwork</th></tr>
                    </thead>
                    <tbody>
                      {periodActivity.studentsWithIssues.map((student: any) => (
                        <tr key={student.id}>
                          <td>{student.rollNumber}</td>
                          <td>{student.name}</td>
                          <td>{student.healthProblems?.join(', ') || '✓'}</td>
                          <td>{student.disciplineIssue || '✓'}</td>
                          <td>{student.homeworkIssue || '✓'}</td>
                          <td>{student.classworkIssue || '✓'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card>
              )}
            </>
          )}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}