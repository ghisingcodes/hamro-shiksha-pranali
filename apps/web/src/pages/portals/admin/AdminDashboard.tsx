import { useQuery } from '@tanstack/react-query';
import { 
  Stack, Title, Text, Paper, SimpleGrid, Card, 
  Group, ThemeIcon, Skeleton, Divider 
} from '@mantine/core';
import { 
  IconUsers, IconSchool, IconUserCheck, 
  IconBook, IconChartBar, IconReceipt 
} from '@tabler/icons-react';
import { api } from '../../../lib/api';

export function AdminDashboard() {
  const schoolId = localStorage.getItem('schoolId');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats', schoolId],
    queryFn: () => api.get(`/dashboard/admin-stats?schoolId=${schoolId}`).then(res => res.data),
    enabled: !!schoolId,
  });

  const statCards = [
    { label: 'Total Students', value: stats?.totalStudents || 0, icon: IconUsers, color: 'blue' },
    { label: 'Total Teachers', value: stats?.totalTeachers || 0, icon: IconUserCheck, color: 'teal' },
    { label: 'Total Classes', value: stats?.totalClasses || 0, icon: IconBook, color: 'orange' },
    { label: 'Fee Collection', value: `Rs. ${(stats?.totalFeesCollected || 0).toLocaleString()}`, icon: IconReceipt, color: 'green' },
  ];

  return (
    <Stack p="md" gap="lg">
      <Paper withBorder p="lg" radius="md" style={{ background: 'linear-gradient(135deg, #1e5a7a 0%, #0e3a52 100%)' }}>
        <Title order={1} c="white">Admin Dashboard</Title>
        <Text c="white" opacity={0.8} mt={4}>Overview of your school</Text>
      </Paper>

      {isLoading ? (
        <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }}>
          {[...Array(4)].map((_, i) => <Skeleton key={i} height={120} radius="md" />)}
        </SimpleGrid>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }}>
          {statCards.map((stat) => (
            <Card key={stat.label} withBorder shadow="sm" p="lg" radius="md">
              <Group>
                <ThemeIcon size="lg" variant="light" color={stat.color}>
                  <stat.icon size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xl" fw={700}>{stat.value}</Text>
                  <Text size="xs" c="dimmed">{stat.label}</Text>
                </div>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <Divider my="md" />

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Card withBorder shadow="sm" p="lg" radius="md">
          <Group mb="md">
            <IconChartBar size={20} />
            <Title order={3}>Recent Activities</Title>
          </Group>
          <Divider mb="md" />
          <Text c="dimmed" ta="center">No recent activities to display.</Text>
        </Card>

        <Card withBorder shadow="sm" p="lg" radius="md">
          <Group mb="md">
            <IconSchool size={20} />
            <Title order={3}>Upcoming Events</Title>
          </Group>
          <Divider mb="md" />
          <Text c="dimmed" ta="center">No upcoming events scheduled.</Text>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}