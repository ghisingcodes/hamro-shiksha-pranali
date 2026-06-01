import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Stack, Title, Text, Paper, Grid, Group, Badge, 
  Card, Divider, Skeleton, ThemeIcon, SimpleGrid, 
  Button
} from '@mantine/core';
import { 
  IconUsers, IconCalendarStats, IconChecklist, 
  IconClock, IconBook, IconChartBar 
} from '@tabler/icons-react';
import { api } from '../../../lib/api';

export function TeacherDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const schoolSlug = localStorage.getItem('schoolSlug');

  // Fetch assigned classes
  const { data: assignedClasses, isLoading: classesLoading } = useQuery({
    queryKey: ['teacherClasses', user.teacherId],
    queryFn: () => api.get(`/class-sections?teacherId=${user.teacherId}`).then(res => res.data),
    enabled: !!user.teacherId,
  });

  // Fetch today's classes
  const { data: todayClasses, isLoading: todayLoading } = useQuery({
    queryKey: ['teacherTodayClasses', user.teacherId],
    queryFn: () => api.get(`/class-sections/teacher/${user.teacherId}/today`).then(res => res.data),
    enabled: !!user.teacherId,
  });

  const classCount = assignedClasses?.length || 0;
  const todayClassCount = todayClasses?.length || 0;

  return (
    <Stack p="md" gap="lg">
      {/* Welcome Section */}
      <Paper withBorder p="lg" radius="md" style={{ background: 'linear-gradient(135deg, #1e5a7a 0%, #0e3a52 100%)' }}>
        <Group justify="space-between" align="flex-start">
          <div>
            <Text size="sm" c="white" opacity={0.8}>Welcome back,</Text>
            <Title order={1} c="white" mt={4}>{user.name || 'Teacher'}</Title>
            <Text c="white" opacity={0.8} mt={4}>{user.email}</Text>
          </div>
          <ThemeIcon size={60} radius="xl" variant="light" color="white" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <IconUsers size={30} />
          </ThemeIcon>
        </Group>
      </Paper>

      <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }}>
        <Card withBorder shadow="sm" p="lg" radius="md">
          <Group>
            <ThemeIcon size="lg" variant="light" color="blue">
              <IconBook size={20} />
            </ThemeIcon>
            <div>
              <Text size="xl" fw={700}>{classCount}</Text>
              <Text size="xs" c="dimmed">Assigned Classes</Text>
            </div>
          </Group>
        </Card>

        <Card withBorder shadow="sm" p="lg" radius="md">
          <Group>
            <ThemeIcon size="lg" variant="light" color="teal">
              <IconClock size={20} />
            </ThemeIcon>
            <div>
              <Text size="xl" fw={700}>{todayClassCount}</Text>
              <Text size="xs" c="dimmed">Today's Classes</Text>
            </div>
          </Group>
        </Card>

        <Card withBorder shadow="sm" p="lg" radius="md">
          <Group>
            <ThemeIcon size="lg" variant="light" color="orange">
              <IconChecklist size={20} />
            </ThemeIcon>
            <div>
              <Text size="xl" fw={700}>0</Text>
              <Text size="xs" c="dimmed">Pending Attendance</Text>
            </div>
          </Group>
        </Card>

        <Card withBorder shadow="sm" p="lg" radius="md">
          <Group>
            <ThemeIcon size="lg" variant="light" color="grape">
              <IconChartBar size={20} />
            </ThemeIcon>
            <div>
              <Text size="xl" fw={700}>0</Text>
              <Text size="xs" c="dimmed">Activities Recorded</Text>
            </div>
          </Group>
        </Card>
      </SimpleGrid>

      {/* Today's Schedule */}
      <Card withBorder shadow="sm" p="lg" radius="md">
        <Group mb="md">
          <IconCalendarStats size={20} />
          <Title order={3}>Today's Schedule</Title>
        </Group>
        <Divider mb="md" />
        {todayLoading ? <Skeleton height={200} /> : (
          todayClassCount > 0 ? (
            <Stack gap="sm">
              {todayClasses?.map((cls: any, idx: number) => (
                <Paper key={idx} withBorder p="md" radius="md">
                  <Group justify="space-between">
                    <div>
                      <Text fw={600}>{cls.className} - Section {cls.section}</Text>
                      <Text size="sm" c="dimmed">Period {cls.period} • {cls.subject}</Text>
                    </div>
                    <Badge color="blue">{cls.time}</Badge>
                  </Group>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Text c="dimmed" ta="center">No classes scheduled for today.</Text>
          )
        )}
      </Card>

      {/* Quick Actions */}
      <Card withBorder shadow="sm" p="lg" radius="md">
        <Title order={3} mb="md">Quick Actions</Title>
        <SimpleGrid cols={{ base: 1, md: 3 }}>
          <Button component="a" href={`/${schoolSlug}/teacher/attendance`} variant="light" color="blue" fullWidth>
            📝 Mark Attendance
          </Button>
          <Button component="a" href={`/${schoolSlug}/teacher/activities`} variant="light" color="teal" fullWidth>
            📖 Record Activities
          </Button>
          <Button component="a" href={`/${schoolSlug}/teacher/schedule`} variant="light" color="orange" fullWidth>
            📅 View Schedule
          </Button>
        </SimpleGrid>
      </Card>
    </Stack>
  );
}