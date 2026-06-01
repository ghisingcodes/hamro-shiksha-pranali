import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Stack, Title, Text, Paper, Grid, Group, Badge, 
  Card, Divider, Skeleton, ThemeIcon, Progress, 
  Button
} from '@mantine/core';
import { 
  IconBook, IconCalendar, IconChecklist, 
  IconClock, IconUser 
} from '@tabler/icons-react';
import { api } from '../../../lib/api';

export function StudentDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const schoolSlug = localStorage.getItem('schoolSlug');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Fetch student's academic record
  const { data: academicRecords, isLoading: recordsLoading } = useQuery({
    queryKey: ['studentAcademicRecord', user.rollNumber],
    queryFn: () => api.get(`/academic-records?rollNumber=${user.rollNumber}&section=${user.section}`).then(res => res.data),
    enabled: !!user.rollNumber,
  });

  // Fetch attendance summary
  const { data: attendanceSummary, isLoading: attendanceLoading } = useQuery({
    queryKey: ['studentAttendanceSummary', user.rollNumber],
    queryFn: () => api.get(`/attendance/student/${user.id}/summary`).then(res => res.data),
    enabled: !!user.id,
  });

  const currentRecord = academicRecords?.[0];
  const attendanceRate = attendanceSummary?.percentage || 0;

  return (
    <Stack p="md" gap="lg">
      {/* Welcome Section */}
      <Paper withBorder p="lg" radius="md" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Group justify="space-between" align="flex-start">
          <div>
            <Text size="sm" c="white" opacity={0.8}>{greeting}</Text>
            <Title order={1} c="white" mt={4}>{user.name || 'Student'}</Title>
            <Group mt={8}>
              <Badge size="lg" variant="light" color="white" c="dark">{user.className}</Badge>
              <Badge size="lg" variant="light" color="white" c="dark">Section {user.section}</Badge>
              <Badge size="lg" variant="light" color="white" c="dark">Roll: {user.rollNumber}</Badge>
            </Group>
          </div>
          <ThemeIcon size={60} radius="xl" variant="light" color="white" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <IconUser size={30} />
          </ThemeIcon>
        </Group>
      </Paper>

      <Grid>
        {/* Attendance Card */}
        <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
          <Card withBorder shadow="sm" p="lg" radius="md">
            <Group mb="xs">
              <ThemeIcon size="lg" variant="light" color="blue">
                <IconChecklist size={20} />
              </ThemeIcon>
              <Text fw={600} size="md">Attendance</Text>
            </Group>
            {attendanceLoading ? <Skeleton height={100} /> : (
              <>
                <Text size="xl" fw={700} ta="center" mt="md">{attendanceRate}%</Text>
                <Progress value={attendanceRate} color="green" size="md" mt="sm" />
                <Text size="xs" c="dimmed" ta="center" mt="sm">
                  Present: {attendanceSummary?.present || 0} • Absent: {attendanceSummary?.absent || 0}
                </Text>
              </>
            )}
          </Card>
        </Grid.Col>

        {/* Current Class Card */}
        <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
          <Card withBorder shadow="sm" p="lg" radius="md">
            <Group mb="xs">
              <ThemeIcon size="lg" variant="light" color="teal">
                <IconBook size={20} />
              </ThemeIcon>
              <Text fw={600} size="md">Current Class</Text>
            </Group>
            {recordsLoading ? <Skeleton height={60} /> : (
              <>
                <Text size="lg" fw={600}>{currentRecord?.classId?.displayName || user.className}</Text>
                <Text size="sm" c="dimmed">Section {currentRecord?.section || user.section}</Text>
                <Text size="sm" c="dimmed" mt="sm">Roll Number: {currentRecord?.rollNumber || user.rollNumber}</Text>
              </>
            )}
          </Card>
        </Grid.Col>

        {/* Quick Actions */}
        <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
          <Card withBorder shadow="sm" p="lg" radius="md">
            <Group mb="xs">
              <ThemeIcon size="lg" variant="light" color="orange">
                <IconCalendar size={20} />
              </ThemeIcon>
              <Text fw={600} size="md">Quick Links</Text>
            </Group>
            <Stack gap="sm" mt="md">
              <Button variant="light" color="blue" fullWidth component="a" href={`/${schoolSlug}/student/homework`}>
                📖 View Homework
              </Button>
              <Button variant="light" color="teal" fullWidth component="a" href={`/${schoolSlug}/student/schedule`}>
                📅 Weekly Schedule
              </Button>
              <Button variant="light" color="orange" fullWidth component="a" href={`/${schoolSlug}/student/results`}>
                📊 Exam Results
              </Button>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Today's Schedule Preview */}
      <Card withBorder shadow="sm" p="lg" radius="md">
        <Group mb="md">
          <IconClock size={20} />
          <Title order={3}>Today's Schedule</Title>
        </Group>
        <Divider mb="md" />
        <Text c="dimmed" ta="center">No classes scheduled for today. Check your weekly schedule for details.</Text>
      </Card>
    </Stack>
  );
}