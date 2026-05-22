import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, Table, Group, Title, Stack, Loader, Badge, Paper, Text, Center, Tooltip } from '@mantine/core';
import { api } from '../../lib/api';
import { AcademicSeason, Student, ClassSection } from '../../lib/types';

const STATUS_COLORS: Record<string, string> = {
  present: 'green',
  absent: 'red',
  late: 'yellow',
  'half-day': 'orange',
  holiday: 'blue',
};

const YEAR_OPTIONS = [
  { value: '2023', label: '2023' }, { value: '2024', label: '2024' },
  { value: '2025', label: '2025' }, { value: '2026', label: '2026' },
];

export function StudentAttendance() {
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const { data: seasons } = useQuery<AcademicSeason[]>({
    queryKey: ['seasons'],
    queryFn: () => api.get('/academic-seasons').then(res => res.data),
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: () => api.get('/students').then(res => res.data),
  });

  const { data: attendanceRecords, isLoading } = useQuery({
    queryKey: ['attendance', selectedStudentId, selectedSeasonId, selectedYear],
    queryFn: () => api.get(`/attendance?studentId=${selectedStudentId}&seasonId=${selectedSeasonId}&startDate=${selectedYear}-01-01&endDate=${selectedYear}-12-31`).then(res => res.data),
    enabled: !!selectedStudentId && !!selectedSeasonId,
  });

  // Group by month
  const groupedByMonth = attendanceRecords?.reduce((acc: any, record: any) => {
    const date = new Date(record.date);
    const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(record);
    return acc;
  }, {});

  const getStatusSummary = (records: any[]) => {
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const halfDay = records.filter(r => r.status === 'half-day').length;
    return { present, absent, late, halfDay };
  };

  return (
    <Stack p="md">
      <Title order={1}>Student Attendance Report</Title>
      
      <Group grow>
        <Select
          label="Academic Season"
          placeholder="Select season"
          data={seasons?.map(s => ({ value: s._id, label: s.name })) || []}
          value={selectedSeasonId}
          onChange={setSelectedSeasonId}
        />
        <Select
          label="Student"
          placeholder="Select student"
          data={students?.map(s => ({ value: s._id, label: `${s.name} (${s.studentId})` })) || []}
          value={selectedStudentId}
          onChange={setSelectedStudentId}
          searchable
          disabled={!selectedSeasonId}
        />
        <Select
          label="Year"
          data={YEAR_OPTIONS}
          value={selectedYear}
          onChange={(val) => setSelectedYear(val || '2025')}
        />
      </Group>

      {isLoading && <Loader />}
      
      {!isLoading && selectedStudentId && selectedSeasonId && attendanceRecords?.length === 0 && (
        <Center h={200}><Text c="dimmed">No attendance records found for this student.</Text></Center>
      )}
      
      {groupedByMonth && Object.entries(groupedByMonth).map(([month, records]: [string, any]) => {
        const summary = getStatusSummary(records);
        return (
          <Paper key={month} withBorder p="md" mt="md">
            <Title order={3}>{month}</Title>
            <Table striped highlightOnHover mt="md">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Status</th>
                  <th>Absent Reason</th>
                  <th>Hygiene Issues</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record: any) => {
                  const date = new Date(record.date);
                  const dayName = date.toLocaleString('default', { weekday: 'long' });
                  return (
                    <tr key={record._id}>
                      <td>{date.toLocaleDateString()}</td>
                      <td>{dayName}</td>
                      <td><Badge color={STATUS_COLORS[record.status] || 'gray'}>{record.status}</Badge></td>
                      <td>{record.absentReason || '—'}</td>
                      <td>
                        {record.hygieneIssues?.length ? (
                          <Group gap={4}>
                            {record.hygieneIssues.slice(0, 2).map((issue: string) => (
                              <Badge key={issue} size="sm" color="orange">{issue}</Badge>
                            ))}
                            {record.hygieneIssues.length > 2 && <Badge size="sm">+{record.hygieneIssues.length - 2}</Badge>}
                          </Group>
                        ) : '—'}
                      </td>
                      <td>{record.remarks || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            
            {/* Summary Cards */}
            <Group mt="md">
              <Paper p="xs" withBorder style={{ flex: 1, textAlign: 'center' }}>
                <Text size="xl" fw={700} c="green">{summary.present}</Text>
                <Text size="xs" c="dimmed">Present</Text>
              </Paper>
              <Paper p="xs" withBorder style={{ flex: 1, textAlign: 'center' }}>
                <Text size="xl" fw={700} c="red">{summary.absent}</Text>
                <Text size="xs" c="dimmed">Absent</Text>
              </Paper>
              <Paper p="xs" withBorder style={{ flex: 1, textAlign: 'center' }}>
                <Text size="xl" fw={700} c="orange">{summary.late}</Text>
                <Text size="xs" c="dimmed">Late</Text>
              </Paper>
              <Paper p="xs" withBorder style={{ flex: 1, textAlign: 'center' }}>
                <Text size="xl" fw={700} c="blue">{summary.halfDay}</Text>
                <Text size="xs" c="dimmed">Half Day</Text>
              </Paper>
            </Group>
          </Paper>
        );
      })}
    </Stack>
  );
}