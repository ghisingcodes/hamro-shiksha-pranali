import { Modal, Stack, Card, Group, Avatar, Text, Badge, Divider, Grid, Title, Paper } from '@mantine/core';
import { IconPhone, IconMail, IconBriefcase, IconMapPin, IconCurrencyRupee, IconSchool, IconDeviceMobile, IconUsers } from '@tabler/icons-react';

interface ParentDetailsModalProps {
  parent: any;
  children: any[];
  studentAddress: { permanent: string; temporary: string };
  opened: boolean;
  onClose: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'green',
  promoted: 'blue',
  failed: 'red',
  repeated: 'orange',
  left: 'gray',
  graduated: 'teal',
};

export function ParentDetailsModal({ parent, children, studentAddress, opened, onClose }: ParentDetailsModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} size="lg" title="Parent / Guardian Details" centered>
      <Stack>
        <Card withBorder radius="md" p="md">
          <Group mb="md">
            <Avatar size="lg" radius="xl" color="blue">
              {parent.name?.charAt(0)}
            </Avatar>
            <div>
              <Text fw={700} size="lg">{parent.relation}: {parent.name}</Text>
              <Badge color={parent.isPrimary ? 'blue' : 'gray'} variant="light">
                {parent.isPrimary ? 'Primary Contact' : 'Secondary Contact'}
              </Badge>
            </div>
          </Group>
          <Divider />
          <Grid mt="md">
            <Grid.Col span={6}><Group gap="xs"><IconPhone size={16} /><Text fw={500}>Phone:</Text><Text>{parent.phone}</Text></Group></Grid.Col>
            <Grid.Col span={6}><Group gap="xs"><IconMail size={16} /><Text fw={500}>Email:</Text><Text>{parent.email || '—'}</Text></Group></Grid.Col>
            <Grid.Col span={6}><Group gap="xs"><IconBriefcase size={16} /><Text fw={500}>Occupation:</Text><Text>{parent.occupation || '—'}</Text></Group></Grid.Col>
            <Grid.Col span={6}><Group gap="xs"><IconMapPin size={16} /><Text fw={500}>Workplace:</Text><Text>{parent.workplace || '—'}</Text></Group></Grid.Col>
            <Grid.Col span={6}><Group gap="xs"><IconCurrencyRupee size={16} /><Text fw={500}>Monthly Income:</Text><Text>₹{parent.monthlyIncome?.toLocaleString() || '—'}</Text></Group></Grid.Col>
            <Grid.Col span={6}><Group gap="xs"><IconCurrencyRupee size={16} /><Text fw={500}>Yearly Income:</Text><Text>₹{parent.yearlyIncome?.toLocaleString() || '—'}</Text></Group></Grid.Col>
            <Grid.Col span={6}><Group gap="xs"><IconSchool size={16} /><Text fw={500}>Education:</Text><Text>{parent.education || '—'}</Text></Group></Grid.Col>
            <Grid.Col span={6}><Group gap="xs"><IconDeviceMobile size={16} /><Text fw={500}>Contact Preference:</Text><Text>{parent.contactPreference || '—'}</Text></Group></Grid.Col>
          </Grid>
        </Card>

        <Card withBorder radius="md" p="md">
          <Group mb="md"><IconMapPin size={20} color="blue" /><Title order={5}>Student's Address</Title></Group>
          <Divider mb="md" />
          <Text fw={500}>🏠 Permanent Address:</Text><Text size="sm">{studentAddress.permanent}</Text>
          <Text fw={500} mt="xs">📍 Temporary Address:</Text><Text size="sm">{studentAddress.temporary}</Text>
        </Card>

        <Card withBorder radius="md" p="md">
          <Group mb="md"><IconUsers size={20} color="green" /><Title order={5}>All Children of this Parent</Title></Group>
          <Divider mb="md" />
          {children.length === 0 ? (
            <Text c="dimmed">No other children registered.</Text>
          ) : (
            <Stack gap="sm">
              {children.map((child, idx) => (
                <Paper key={idx} withBorder p="sm" radius="md">
                  <Group justify="space-between">
                    <div><Text fw={500}>{child.name}</Text><Text size="xs" c="dimmed">ID: {child.studentId}</Text></div>
                    <Badge color={STATUS_COLORS[child.status] || 'gray'}>{child.currentClass} - {child.status}</Badge>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Card>
      </Stack>
    </Modal>
  );
}