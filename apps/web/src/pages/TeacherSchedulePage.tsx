import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, Button, Group, Title, Stack, Card, Text, Loader, Table, Badge } from '@mantine/core';
import { IconCalendarTime } from '@tabler/icons-react';
import { api } from '../lib/api';
import { Teacher, ClassSection } from '../lib/types';
import { notifications } from '@mantine/notifications';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_ABBR = ['M', 'T', 'W', 'Th', 'F'];

export function TeacherSchedulePage() {
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSeasonId, setSelectedSeasonId] = useState('');

  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then(res => res.data),
  });

  const { data: seasons } = useQuery({
    queryKey: ['seasons'],
    queryFn: () => api.get('/academic-seasons').then(res => res.data),
  });

  const { data: classSections, refetch, isLoading, isError } = useQuery<ClassSection[]>({
    queryKey: ['classSections', selectedSeasonId],
    queryFn: () => api.get(`/class-sections?seasonId=${selectedSeasonId}`).then(res => res.data),
    enabled: !!selectedSeasonId && !!selectedTeacher,
  });

  const handleShowSchedule = () => {
    if (!selectedTeacher) {
      notifications.show({ title: 'Error', message: 'Please select a teacher', color: 'red' });
      return;
    }
    if (!selectedSeasonId) {
      notifications.show({ title: 'Error', message: 'Please select an academic season', color: 'red' });
      return;
    }
    refetch();
  };

  // Build aggregated schedule per class/section
  const buildAggregatedSchedule = () => {
    if (!classSections) return [];
    const result = [];

    for (const cs of classSections) {
      const className = (cs.classId as any)?.displayName || 'Unknown Class';
      const periodCount = cs.sections[0]?.routine[0]?.length || 5;

      for (const section of cs.sections) {
        const sectionName = section.name;
        // For each period (0..periodCount-1), collect days where teacher teaches
        const periodAssignments = [];

        for (let period = 0; period < periodCount; period++) {
          const daysTaught = [];
          let subject = null;

          for (let day = 0; day < 5; day++) {
            const entry = section.routine[day]?.[period];
            if (entry && entry.teacher === selectedTeacher) {
              daysTaught.push(DAY_ABBR[day]);
              if (!subject) subject = entry.subject;
              else if (subject !== entry.subject) {
                // If multiple subjects in same period, we'll handle by showing as separate entries? For simplicity, we'll combine with warning.
                subject = `${subject} / ${entry.subject}`;
              }
            }
          }

          if (daysTaught.length > 0) {
            periodAssignments.push({
              period: period + 1,
              days: daysTaught,
              subject: subject || '—',
            });
          }
        }

        if (periodAssignments.length > 0) {
          result.push({
            className,
            section: sectionName,
            periods: periodAssignments,
          });
        }
      }
    }
    return result;
  };

  const aggregated = buildAggregatedSchedule();

  if (isError) {
    return (
      <Stack p="md">
        <Title order={1}>Teacher Schedule</Title>
        <Text c="red">Failed to load schedule. Please try again later.</Text>
      </Stack>
    );
  }

  return (
    <Stack p="md">
      <Title order={1}>Teacher Schedule</Title>
      <Group align="flex-end">
        <Select
          label="Academic Season"
          placeholder="Select season"
          data={seasons?.map(s => ({ value: s._id, label: s.name })) || []}
          value={selectedSeasonId}
          onChange={setSelectedSeasonId}
          style={{ width: 250 }}
        />
        <Select
          label="Select Teacher"
          placeholder="Choose teacher"
          data={teachers?.map(t => ({ value: t.name, label: t.name })) || []}
          value={selectedTeacher}
          onChange={setSelectedTeacher}
          style={{ width: 250 }}
          searchable
          clearable
        />
        <Button leftSection={<IconCalendarTime size={18} />} onClick={handleShowSchedule} loading={isLoading}>
          Show Schedule
        </Button>
      </Group>

      {isLoading && <Loader mt="md" />}

      {!isLoading && aggregated.length === 0 && (
        <Text c="dimmed" mt="md">No classes assigned to this teacher for the selected season.</Text>
      )}

      {aggregated.map((item, idx) => (
        <Card key={idx} withBorder shadow="sm" mt="md">
          <Title order={3}>{item.className} - Section {item.section}</Title>
          <Table striped highlightOnHover mt="sm">
            <thead>
              <tr>
                <th>Period</th>
                <th>Subject</th>
                <th>Days Taught</th>
              </tr>
            </thead>
            <tbody>
              {item.periods.map(p => (
                <tr key={p.period}>
                  <td><Badge size="sm" variant="light">Period {p.period}</Badge></td>
                  <td>{p.subject}</td>
                  <td>{p.days.join(', ')} (Total: {p.days.length} days)</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ))}
    </Stack>
  );
}