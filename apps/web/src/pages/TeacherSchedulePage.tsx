import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, Button, Group, Title, Stack, Card, Text, Loader } from '@mantine/core';
import { IconCalendarTime } from '@tabler/icons-react';
import { createColumnHelper } from '@tanstack/react-table';
import { api } from '../lib/api';
import { Teacher } from '../lib/types';
import { DataTable } from '../components/DataTable';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function TeacherSchedulePage() {
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const { data: teachers } = useQuery<Teacher[]>({ queryKey: ['teachers'], queryFn: () => api.get('/teachers').then(res => res.data) });
  const { data: schedule, refetch, isLoading } = useQuery({
    queryKey: ['teacherSchedule', selectedTeacher],
    queryFn: () => api.get(`/class-sections/teacher/${encodeURIComponent(selectedTeacher)}/schedule`).then(res => res.data),
    enabled: !!selectedTeacher,
  });

  if (isLoading) return <Loader />;

  return (
    <Stack p="md">
      <Title order={1}>Teacher Schedule</Title>
      <Group align="flex-end">
        <Select
          label="Select Teacher"
          placeholder="Choose teacher"
          data={teachers?.map(t => ({ value: t.name, label: t.name })) || []}
          value={selectedTeacher}
          onChange={setSelectedTeacher}
          style={{ width: 300 }}
        />
        <Button leftSection={<IconCalendarTime size={18} />} onClick={() => refetch()}>Show Schedule</Button>
      </Group>

      {schedule && schedule.length === 0 && <Text c="dimmed" mt="md">No classes assigned to this teacher.</Text>}

      {schedule?.map((item: any, idx: number) => {
        const periodCount = item.assignments[0]?.length || 7;
        const columns = [
          { accessorKey: 'day', header: 'Day / Period' },
          ...Array.from({ length: periodCount }).map((_, i) => ({ accessorKey: `period${i}`, header: `Period ${i+1}` })),
        ];
        const data = DAYS.map((day, d) => ({
          day,
          ...Object.fromEntries(Array.from({ length: periodCount }).map((_, p) => [`period${p}`, item.assignments[d]?.[p]?.subject || '—'])),
        }));
        const { getCoreRowModel, useReactTable } = require('@tanstack/react-table');
        const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

        return (
          <Card key={idx} withBorder shadow="sm" mt="md">
            <Title order={3}>{item.className} - {item.section}</Title>
            <DataTable table={table} />
          </Card>
        );
      })}
    </Stack>
  );
}