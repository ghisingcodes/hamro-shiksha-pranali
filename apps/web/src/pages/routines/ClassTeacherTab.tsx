import { Stack, Card, Text, Title, Center } from '@mantine/core';
import { IconUserShield } from '@tabler/icons-react';

export function ClassTeacherTab() {
  return (
    <Stack>
      <Card withBorder shadow="sm" p="xl" radius="md" style={{ minHeight: 300 }}>
        <Center style={{ flexDirection: 'column', height: '100%' }}>
          <IconUserShield size={64} stroke={1.5} color="#adb5bd" />
          <Title order={3} c="dimmed" mt="md">Class Teacher Management</Title>
          <Text c="dimmed" size="sm" mt="sm" ta="center">
            This feature is coming soon.<br />
            Here you will be able to assign and manage class teachers for each section.
          </Text>
        </Center>
      </Card>
    </Stack>
  );
}