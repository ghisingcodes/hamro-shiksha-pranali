import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Stack, Title, Text, Paper, Grid, Group, Badge, 
  Card, Divider, Skeleton, ThemeIcon, Select, Progress, 
  Button
} from '@mantine/core';
import { 
  IconUsers, IconBook, IconChecklist, 
  IconClock, IconSchool, IconChartBar 
} from '@tabler/icons-react';
import { api } from '../../../lib/api';

export function ParentDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [selectedChild, setSelectedChild] = useState(user.children?.[0]?.id || '');

  const selectedChildData = user.children?.find((c: any) => c.id === selectedChild);

  // Fetch selected child's attendance
  const { data: attendanceSummary, isLoading: attendanceLoading } = useQuery({
    queryKey: ['childAttendance', selectedChild],
    queryFn: () => api.get(`/attendance/student/${selectedChild}/summary`).then(res => res.data),
    enabled: !!selectedChild,
  });

  // Fetch selected child's academic record
  const { data: academicRecord } = useQuery({
    queryKey: ['childAcademicRecord', selectedChild],
    queryFn: () => api.get(`/academic-records?studentId=${selectedChild}`).then(res => res.data),
    enabled: !!selectedChild,
  });

  const attendanceRate = attendanceSummary?.percentage || 0;
  const currentRecord = academicRecord?.[0];

  return (
    <Stack p="md" gap="lg">
      {/* Welcome Section */}
      <Paper withBorder p="lg" radius="md" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
        <Group justify="space-between" align="flex-start">
          <div>
            <Text size="sm" c="white" opacity={0.8}>Welcome,</Text>
            <Title order={1} c="white" mt={4}>{user.name || 'Parent'}</Title>
          </div>
          <ThemeIcon size={60} radius="xl" variant="light" color="white" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <IconUsers size={30} />
          </ThemeIcon>
        </Group>
      </Paper>

      {/* Child Selector */}
      {user.children && user.children.length > 0 && (
        <Card withBorder shadow="sm" p="lg" radius="md">
          <Select
            label="Select Child"
            placeholder="Choose your child"
            data={user.children.map((child: any) => ({ value: child.id, label: `${child.name} (${child.className} - ${child.section})` }))}
            value={selectedChild}
            onChange={(val) => setSelectedChild(val || '')}
          />
        </Card>
      )}

      {selectedChildData && (
        <Grid>
          {/* Child Info Card */}
          <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
            <Card withBorder shadow="sm" p="lg" radius="md">
              <Group mb="xs">
                <ThemeIcon size="lg" variant="light" color="blue">
                  <IconSchool size={20} />
                </ThemeIcon>
                <Text fw={600} size="md">Student Info</Text>
              </Group>
              <Stack gap={4} mt="md">
                <Text><strong>Name:</strong> {selectedChildData.name}</Text>
                <Text><strong>Class:</strong> {selectedChildData.className}</Text>
                <Text><strong>Section:</strong> {selectedChildData.section}</Text>
                <Text><strong>Roll Number:</strong> {selectedChildData.rollNumber}</Text>
              </Stack>
            </Card>
          </Grid.Col>

          {/* Attendance Card */}
          <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
            <Card withBorder shadow="sm" p="lg" radius="md">
              <Group mb="xs">
                <ThemeIcon size="lg" variant="light" color="teal">
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

          {/* Academic Status */}
          <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
            <Card withBorder shadow="sm" p="lg" radius="md">
              <Group mb="xs">
                <ThemeIcon size="lg" variant="light" color="orange">
                  <IconBook size={20} />
                </ThemeIcon>
                <Text fw={600} size="md">Academic Status</Text>
              </Group>
              <Stack gap={4} mt="md">
                <Text><strong>Status:</strong> {currentRecord?.status || 'Active'}</Text>
                <Text><strong>Enrolled Since:</strong> {currentRecord?.createdAt ? new Date(currentRecord.createdAt).toLocaleDateString() : 'N/A'}</Text>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      )}

      {/* Quick Links */}
      <Card withBorder shadow="sm" p="lg" radius="md">
        <Title order={3} mb="md">Quick Links</Title>
        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Button component="a" href={`/${localStorage.getItem('schoolSlug')}/parent/homework`} variant="light" color="blue" fullWidth>
              📖 View Homework
            </Button>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Button component="a" href={`/${localStorage.getItem('schoolSlug')}/parent/attendance`} variant="light" color="teal" fullWidth>
              📅 Attendance History
            </Button>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Button component="a" href={`/${localStorage.getItem('schoolSlug')}/parent/fees`} variant="light" color="orange" fullWidth>
              💰 Fee Status
            </Button>
          </Grid.Col>
        </Grid>
      </Card>
    </Stack>
  );
}