import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Tabs,
  Select,
  Title,
  Stack,
  Loader,
  Alert,
  Box,
  Text,
  Tooltip,
  Paper,
  Center,
  ThemeIcon,
  Group,
  Button,
  Badge,
  Card,
  Table as MantineTable,
  TextInput,
} from '@mantine/core';
import {
  IconSchool,
  IconCalendar,
  IconClock,
  IconCalendarTime,
  IconUsers,
  IconSearch,
} from '@tabler/icons-react';
import { api } from '../lib/api';
import { AcademicSeason, ClassSection, Teacher } from '../lib/types';

// ---------- Helper for building cell summaries ----------
const DAY_ABBR = ['M', 'T', 'W', 'Th', 'F'];

function buildCellSummary(routine: any[][], periodIndex: number) {
  const entries = [];
  for (let day = 0; day < 5; day++) {
    const entry = routine[day]?.[periodIndex];
    if (entry && (entry.subject || entry.teacher)) {
      entries.push({ day, subject: entry.subject || '—', teacher: entry.teacher || '—' });
    }
  }
  if (entries.length === 0) return { summary: '—', tooltip: '' };

  const groups = new Map();
  for (const e of entries) {
    const key = `${e.subject}|${e.teacher}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(DAY_ABBR[e.day]);
  }

  const parts = [];
  for (const [key, days] of groups.entries()) {
    const [subject, teacher] = key.split('|');
    const dayStr = days.length === 5 ? 'All days' : days.join(', ');
    parts.push(`📘 ${subject} (${dayStr}) · 👩‍🏫 ${teacher}`);
  }
  const summary = parts.join(' · ');
  const tooltip = entries.map(e => `${DAY_ABBR[e.day]}: ${e.subject} (${e.teacher})`).join('\n');
  return { summary, tooltip };
}

// ---------- All Routines Tab (with search filter) ----------
function AllRoutinesTab({ seasonId }: { seasonId: string }) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: classSections, isLoading, error } = useQuery<ClassSection[]>({
    queryKey: ['classSections', seasonId],
    queryFn: () => api.get(`/class-sections?seasonId=${seasonId}`).then(res => res.data),
    enabled: !!seasonId,
  });

  const rows = useMemo(() => {
    if (!classSections) return [];
    const result = [];
    for (const cs of classSections) {
      const className = (cs.classId as any)?.displayName || 'Unknown Class';
      for (const section of cs.sections) {
        result.push({
          id: `${cs._id}-${section.name}`,
          label: `${className} – ${section.name}`,
          routine: section.routine,
          periodCount: (cs.classId as any)?.periodCount || 7,
        });
      }
    }
    return result;
  }, [classSections]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const query = searchQuery.toLowerCase();
    return rows.filter(row => row.label.toLowerCase().includes(query));
  }, [rows, searchQuery]);

  const maxPeriods = useMemo(() => {
    if (filteredRows.length === 0) return 7;
    return Math.max(...filteredRows.map(r => r.periodCount));
  }, [filteredRows]);

  if (isLoading) return <Loader />;
  if (error) return <Alert color="red">Error loading routines: {error.message}</Alert>;
  if (!classSections?.length) return <Text c="dimmed" ta="center">No routines found for this season.</Text>;

  return (
    <Stack gap="md">
      <TextInput
        placeholder="Search by class or section..."
        leftSection={<IconSearch size={16} />}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.currentTarget.value)}
        radius="md"
      />
      <Paper shadow="md" radius="lg" withBorder style={{ overflow: 'hidden', backgroundColor: '#ffffff' }}>
        <Box style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 350px)', overflowY: 'auto' }}>
          <MantineTable
            striped={false}
            highlightOnHover
            withColumnBorders={false}
            horizontalSpacing="lg"
            verticalSpacing="md"
            fontSize="sm"
            style={{
              borderCollapse: 'separate',
              borderSpacing: 0,
              width: '100%',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            }}
          >
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '16px 20px', fontWeight: 700, fontSize: '0.9rem', position: 'sticky', left: 0, backgroundColor: 'inherit', zIndex: 2 }}>
                  <Group gap="xs"><IconSchool size={18} />Class & Section</Group>
                </th>
                {Array.from({ length: maxPeriods }).map((_, i) => (
                  <th key={i} style={{ padding: '16px 12px', fontWeight: 600, textAlign: 'center' }}>
                    <div><Text size="xs" c="dimmed">Period</Text><Text size="lg" fw={700}>{i + 1}</Text></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, idx) => (
                <tr key={row.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafcff' }}>
                  <td style={{ fontWeight: 600, position: 'sticky', left: 0, backgroundColor: 'inherit', padding: '14px 20px' }}>
                    {row.label}
                  </td>
                  {Array.from({ length: maxPeriods }).map((_, periodIdx) => {
                    if (periodIdx >= row.periodCount) {
                      return <td key={periodIdx} style={{ textAlign: 'center', color: '#cbd5e1' }}>—</td>;
                    }
                    const { summary, tooltip } = buildCellSummary(row.routine, periodIdx);
                    const hasData = summary !== '—';
                    return (
                      <td key={periodIdx} style={{ padding: '12px 8px' }}>
                        {hasData ? (
                          <Tooltip label={tooltip} multiline width={260} withArrow color="dark" position="top">
                            <Text size="sm" style={{ cursor: 'pointer', borderBottom: '1px dotted #cbd5e1' }}>
                              {summary}
                            </Text>
                          </Tooltip>
                        ) : <Text c="dimmed" fs="italic" ta="center">—</Text>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </MantineTable>
        </Box>
      </Paper>
    </Stack>
  );
}

// ---------- Teacher Schedule Tab (single row per class-section, periods as columns) ----------
function TeacherScheduleTab({ seasonId }: { seasonId: string }) {
  const [selectedTeacher, setSelectedTeacher] = useState('');

  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then(res => res.data),
  });

  const { data: classSections, refetch, isLoading, isError } = useQuery<ClassSection[]>({
    queryKey: ['classSections', seasonId],
    queryFn: () => api.get(`/class-sections?seasonId=${seasonId}`).then(res => res.data),
    enabled: !!seasonId && !!selectedTeacher,
  });

  const handleShow = () => {
    if (!selectedTeacher) return;
    refetch();
  };

  // Build rows: each class-section becomes one row, with a cell per period
  const rows = useMemo(() => {
    if (!classSections || !selectedTeacher) return [];

    const result = [];
    for (const cs of classSections) {
      const className = (cs.classId as any)?.displayName || 'Unknown Class';
      const periodCount = cs.sections[0]?.routine[0]?.length || 7;
      for (const section of cs.sections) {
        const sectionName = section.name;
        const periodCells = [];

        for (let period = 0; period < periodCount; period++) {
          const entries = [];
          for (let day = 0; day < 5; day++) {
            const entry = section.routine[day]?.[period];
            if (entry && entry.teacher === selectedTeacher) {
              entries.push({ day, subject: entry.subject || '—' });
            }
          }
          if (entries.length === 0) {
            periodCells.push({ summary: '—', tooltip: '' });
            continue;
          }
          // Group by subject (if multiple subjects, concatenate)
          const groups = new Map();
          for (const e of entries) {
            if (!groups.has(e.subject)) groups.set(e.subject, []);
            groups.get(e.subject).push(DAY_ABBR[e.day]);
          }
          const parts = [];
          for (const [subject, days] of groups.entries()) {
            const dayStr = days.length === 5 ? 'All days' : days.join(', ');
            parts.push(`${subject} (${dayStr})`);
          }
          const summary = parts.join(' · ');
          const tooltip = entries.map(e => `${DAY_ABBR[e.day]}: ${e.subject}`).join('\n');
          periodCells.push({ summary, tooltip });
        }

        if (periodCells.some(cell => cell.summary !== '—')) {
          result.push({
            id: `${cs._id}-${section.name}`,
            label: `${className} – ${section.name}`,
            periodCells,
            periodCount,
          });
        }
      }
    }
    return result;
  }, [classSections, selectedTeacher]);

  const maxPeriods = useMemo(() => {
    if (rows.length === 0) return 7;
    return Math.max(...rows.map(r => r.periodCount));
  }, [rows]);

  if (!seasonId) return <Text c="dimmed">Please select a season first.</Text>;

  return (
    <Stack gap="md">
      <Group align="flex-end">
        <Select
          label="Select Teacher"
          placeholder="Choose teacher"
          data={teachers?.map(t => ({ value: t.name, label: t.name })) || []}
          value={selectedTeacher}
          onChange={setSelectedTeacher}
          style={{ flex: 1 }}
          searchable
          clearable
        />
        <Button leftSection={<IconCalendarTime size={18} />} onClick={handleShow} loading={isLoading}>
          Show Schedule
        </Button>
      </Group>

      {isLoading && <Loader />}
      {isError && <Alert color="red">Error loading schedule</Alert>}
      {!isLoading && selectedTeacher && rows.length === 0 && (
        <Text c="dimmed">No classes assigned to this teacher for the selected season.</Text>
      )}

      {rows.length > 0 && (
        <Paper shadow="md" radius="lg" withBorder style={{ overflow: 'hidden' }}>
          <Box style={{ overflowX: 'auto' }}>
            <MantineTable
              striped
              highlightOnHover
              withColumnBorders={false}
              horizontalSpacing="lg"
              verticalSpacing="md"
              fontSize="sm"
            >
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Class & Section</th>
                  {Array.from({ length: maxPeriods }).map((_, i) => (
                    <th key={i} style={{ padding: '12px 16px', textAlign: 'center' }}>Period {i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: 600, backgroundColor: idx % 2 === 0 ? '#fafcff' : '#ffffff' }}>
                      {row.label}
                    </td>
                    {row.periodCells.map((cell, periodIdx) => (
                      <td key={periodIdx} style={{ textAlign: 'center' }}>
                        {cell.summary !== '—' ? (
                          <Tooltip label={cell.tooltip} multiline width={220} withArrow color="dark">
                            <Text size="sm" style={{ cursor: 'help' }}>{cell.summary}</Text>
                          </Tooltip>
                        ) : <Text c="dimmed">—</Text>}
                      </td>
                    ))}
                    {/* If row has fewer periods than maxPeriods, fill empty cells */}
                    {Array.from({ length: maxPeriods - row.periodCount }).map((_, i) => (
                      <td key={`empty-${i}`} style={{ textAlign: 'center', backgroundColor: '#fafafc' }}>—</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </MantineTable>
          </Box>
        </Paper>
      )}
    </Stack>
  );
}

// ---------- Main Component with Tabs ----------
export function RoutinesView() {
  const [selectedSeasonId, setSelectedSeasonId] = useState('');

  const { data: seasons } = useQuery<AcademicSeason[]>({
    queryKey: ['seasons'],
    queryFn: () => api.get('/academic-seasons').then(res => res.data),
  });

  return (
    <Stack p="md" gap="xl">
      <div>
        <Title order={1} display="flex" style={{ alignItems: 'center', gap: 8 }}>
          <ThemeIcon size={36} radius="xl" color="blue" variant="light">
            <IconSchool size={22} />
          </ThemeIcon>
          Routines Manager
        </Title>
        <Text c="dimmed" size="sm" mt={4}>
          View class routines or teacher schedules by academic season
        </Text>
      </div>

      <Select
        label="Academic Season"
        placeholder="Choose a season"
        data={seasons?.map(s => ({ value: s._id, label: s.name })) || []}
        value={selectedSeasonId}
        onChange={(val) => setSelectedSeasonId(val || '')}
        clearable
        radius="md"
        size="md"
        leftSection={<IconCalendar size={18} />}
      />

      {!selectedSeasonId && (
        <Center h={200}>
          <Stack align="center" gap="xs">
            <IconClock size={48} stroke={1.5} color="#adb5bd" />
            <Text c="dimmed" size="lg">Select an academic season to view routines</Text>
          </Stack>
        </Center>
      )}

      {selectedSeasonId && (
        <Tabs defaultValue="all" variant="outline" radius="md">
          <Tabs.List grow>
            <Tabs.Tab value="all" leftSection={<IconUsers size={18} />}>All Routines</Tabs.Tab>
            <Tabs.Tab value="teacher" leftSection={<IconSchool size={18} />}>Teacher Schedule</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="all" pt="md">
            <AllRoutinesTab seasonId={selectedSeasonId} />
          </Tabs.Panel>
          <Tabs.Panel value="teacher" pt="md">
            <TeacherScheduleTab seasonId={selectedSeasonId} />
          </Tabs.Panel>
        </Tabs>
      )}
    </Stack>
  );
}