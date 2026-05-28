import { Modal, Stack, Card, Group, Avatar, Text, Badge, Divider, Grid, ThemeIcon } from '@mantine/core';
import { IconId, IconMail, IconPhone, IconMapPin, IconBriefcase, IconBook } from '@tabler/icons-react';
import { Teacher } from '../../lib/types';

interface TeacherDetailModalProps {
  teacher: Teacher;
  opened: boolean;
  onClose: () => void;
}

export function TeacherDetailModal({ teacher, opened, onClose }: TeacherDetailModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} size="lg" title="Teacher Details" centered>
      <Stack>
        <Card withBorder radius="md" p="md">
          <Group>
            <Avatar size="xl" radius="xl" color="blue">{teacher.name?.charAt(0)}</Avatar>
            <div>
              <Text fw={700} size="xl">{teacher.name}</Text>
              <Text size="sm" c="dimmed">Teacher ID: {teacher.teacherId}</Text>
            </div>
          </Group>
        </Card>

        <Card withBorder radius="md" p="md">
          <Group mb="md">
            <ThemeIcon size="md" color="blue" variant="light" radius="xl"><IconId size={16} /></ThemeIcon>
            <Text fw={600}>Personal Information</Text>
          </Group>
          <Divider mb="md" />
          <Grid>
            <Grid.Col span={6}><Group gap="xs"><IconMail size={14} color="gray" /><Text size="sm">Email:</Text><Text size="sm">{teacher.email || '—'}</Text></Group></Grid.Col>
            <Grid.Col span={6}><Group gap="xs"><IconPhone size={14} color="gray" /><Text size="sm">Phone:</Text><Text size="sm">{teacher.phone || '—'}</Text></Group></Grid.Col>
            <Grid.Col span={12}><Group gap="xs"><IconMapPin size={14} color="gray" /><Text size="sm">Address:</Text><Text size="sm">{teacher.address || '—'}</Text></Group></Grid.Col>
          </Grid>
        </Card>

        <Card withBorder radius="md" p="md">
          <Group mb="md">
            <ThemeIcon size="md" color="green" variant="light" radius="xl"><IconBriefcase size={16} /></ThemeIcon>
            <Text fw={600}>Professional Information</Text>
          </Group>
          <Divider mb="md" />
          <Grid>
            <Grid.Col span={6}><Text size="sm" fw={500}>Qualification:</Text><Text size="sm">{teacher.qualification || '—'}</Text></Grid.Col>
            <Grid.Col span={6}><Text size="sm" fw={500}>Experience:</Text><Text size="sm">{teacher.experience || 0} years</Text></Grid.Col>
            <Grid.Col span={6}><Text size="sm" fw={500}>Employment Type:</Text><Text size="sm">{teacher.employmentType || '—'}</Text></Grid.Col>
            <Grid.Col span={6}><Text size="sm" fw={500}>Status:</Text><Badge color={teacher.status === 'active' ? 'green' : 'red'}>{teacher.status || 'active'}</Badge></Grid.Col>
          </Grid>
        </Card>

        <Card withBorder radius="md" p="md">
          <Group mb="md">
            <ThemeIcon size="md" color="orange" variant="light" radius="xl"><IconBook size={16} /></ThemeIcon>
            <Text fw={600}>Subjects</Text>
          </Group>
          <Divider mb="md" />
          <Group gap="xs">
            {teacher.subjects?.length ? teacher.subjects.map(s => <Badge key={s} size="md" variant="light">{s}</Badge>) : <Text c="dimmed">No subjects assigned</Text>}
          </Group>
        </Card>
      </Stack>
    </Modal>
  );
}