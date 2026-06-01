import { useQuery } from '@tanstack/react-query';
import { 
  Stack, Title, Text, Paper, SimpleGrid, Card, 
  Group, ThemeIcon, Skeleton 
} from '@mantine/core';
import { 
  IconChecklist, IconClock, IconCalendar, 
  IconUserCheck, IconBriefcase 
} from '@tabler/icons-react';
import { api } from '../../../lib/api';

export function StaffDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['staffTasks', user.id],
    queryFn: () => api.get(`/staff/${user.id}/tasks`).then(res => res.data),
    enabled: !!user.id,
  });

  const pendingTasks = tasks?.filter((t: any) => t.status === 'pending').length || 0;
  const completedTasks = tasks?.filter((t: any) => t.status === 'completed').length || 0;

  return (
    <Stack p="md" gap="lg">
      <Paper withBorder p="lg" radius="md" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
        <Title order={1} c="white">Staff Dashboard</Title>
        <Text c="white" opacity={0.8} mt={4}>Welcome back, {user.name || 'Staff'}</Text>
      </Paper>

      {isLoading ? (
        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }}>
          {[...Array(3)].map((_, i) => <Skeleton key={i} height={120} radius="md" />)}
        </SimpleGrid>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }}>
          <Card withBorder shadow="sm" p="lg" radius="md">
            <Group>
              <ThemeIcon size="lg" variant="light" color="orange">
                <IconChecklist size={20} />
              </ThemeIcon>
              <div>
                <Text size="xl" fw={700}>{pendingTasks}</Text>
                <Text size="xs" c="dimmed">Pending Tasks</Text>
              </div>
            </Group>
          </Card>

          <Card withBorder shadow="sm" p="lg" radius="md">
            <Group>
              <ThemeIcon size="lg" variant="light" color="green">
                <IconUserCheck size={20} />
              </ThemeIcon>
              <div>
                <Text size="xl" fw={700}>{completedTasks}</Text>
                <Text size="xs" c="dimmed">Completed Tasks</Text>
              </div>
            </Group>
          </Card>

          <Card withBorder shadow="sm" p="lg" radius="md">
            <Group>
              <ThemeIcon size="lg" variant="light" color="blue">
                <IconBriefcase size={20} />
              </ThemeIcon>
              <div>
                <Text size="xl" fw={700}>{user.position || 'Staff'}</Text>
                <Text size="xs" c="dimmed">Position</Text>
              </div>
            </Group>
          </Card>
        </SimpleGrid>
      )}

      <Card withBorder shadow="sm" p="lg" radius="md">
        <Group mb="md">
          <IconCalendar size={20} />
          <Title order={3}>Today's Schedule</Title>
        </Group>
        <Text c="dimmed" ta="center">No tasks scheduled for today.</Text>
      </Card>
    </Stack>
  );
}