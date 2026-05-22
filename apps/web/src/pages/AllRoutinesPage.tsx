import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, Table, Title, Stack, Loader, Alert, Box, Text, Tooltip, Paper, Center, ThemeIcon } from '@mantine/core';
import { IconSchool, IconCalendar, IconClock } from '@tabler/icons-react';
import { api } from '../lib/api';
import { AcademicSeason, ClassSection } from '../lib/types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_ABBR = ['M', 'T', 'W', 'Th', 'F'];

// Helper to build a compact cell summary
function buildCellSummary(routine: any[][], periodIndex: number) {
  const entries = [];
  for (let day = 0; day < 5; day++) {
    const entry = routine[day]?.[periodIndex];
    if (entry && (entry.subject || entry.teacher)) {
      entries.push({ day, subject: entry.subject || '—', teacher: entry.teacher || '—' });
    }
  }
  if (entries.length === 0) return { summary: '—', tooltip: '' };

  // Group by (subject, teacher)
  const groups = new Map();
  for (const e of entries) {
    const key = `${e.subject}|${e.teacher}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(DAY_ABBR[e.day]);
  }

  // Build text representation
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

export function AllRoutinesPage() {
  const [selectedSeasonId, setSelectedSeasonId] = useState('');

  const { data: seasons } = useQuery<AcademicSeason[]>({
    queryKey: ['seasons'],
    queryFn: () => api.get('/academic-seasons').then(res => res.data),
  });

  const { data: classSections, isLoading, error } = useQuery<ClassSection[]>({
    queryKey: ['classSections', selectedSeasonId],
    queryFn: () => api.get(`/class-sections?seasonId=${selectedSeasonId}`).then(res => res.data),
    enabled: !!selectedSeasonId,
  });

  // Prepare rows: flatten all class-section combinations
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

  // Determine maximum period count across all rows
  const maxPeriods = useMemo(() => {
    if (rows.length === 0) return 7;
    return Math.max(...rows.map(r => r.periodCount));
  }, [rows]);

  if (isLoading) return <Loader />;
  if (error) return <Alert color="red">Error loading data: {error.message}</Alert>;

  return (
    <Stack p="md" gap="xl">
      <div>
        <Title order={1} display="flex" style={{ alignItems: 'center', gap: 8 }}>
          <ThemeIcon size={36} radius="xl" color="blue" variant="light">
            <IconSchool size={22} />
          </ThemeIcon>
          All Classes Routine
        </Title>
        <Text c="dimmed" size="sm" mt={4}>
          View weekly schedule for all classes and sections, period by period
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

      {selectedSeasonId && rows.length > 0 && (
        <Paper shadow="md" radius="lg" withBorder style={{ overflow: 'hidden', backgroundColor: '#ffffff' }}>
          <Box style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
            <Table
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
                  <th
                    style={{
                      padding: '16px 20px',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      letterSpacing: '-0.01em',
                      borderRight: '1px solid #e2e8f0',
                      position: 'sticky',
                      left: 0,
                      backgroundColor: 'inherit',
                      zIndex: 2,
                      borderTopLeftRadius: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <IconSchool size={18} stroke={1.5} />
                      Class & Section
                    </div>
                  </th>
                  {Array.from({ length: maxPeriods }).map((_, i) => (
                    <th
                      key={i}
                      style={{
                        padding: '16px 12px',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        textAlign: 'center',
                        backgroundColor: 'inherit',
                        borderBottom: '2px solid #e2e8f0',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Text size="xs" c="dimmed" fw={500}>Period</Text>
                        <Text size="lg" fw={700} style={{ lineHeight: 1.2 }}>{i + 1}</Text>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    style={{
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafcff',
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <td
                      style={{
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        backgroundColor: 'inherit',
                        borderRight: '1px solid #e2e8f0',
                        position: 'sticky',
                        left: 0,
                        zIndex: 1,
                        padding: '14px 20px',
                      }}
                    >
                      {row.label}
                    </td>
                    {Array.from({ length: maxPeriods }).map((_, periodIdx) => {
                      if (periodIdx >= row.periodCount) {
                        return (
                          <td
                            key={periodIdx}
                            style={{ textAlign: 'center', padding: '14px 8px', color: '#cbd5e1' }}
                          >
                            <Text size="sm" c="dimmed">—</Text>
                          </td>
                        );
                      }
                      const { summary, tooltip } = buildCellSummary(row.routine, periodIdx);
                      const hasData = summary !== '—';
                      return (
                        <td key={periodIdx} style={{ verticalAlign: 'top', padding: '12px 8px' }}>
                          {hasData ? (
                            <Tooltip
                              label={tooltip}
                              multiline
                              width={260}
                              withArrow
                              color="dark"
                              position="top"
                              transitionProps={{ transition: 'fade', duration: 200 }}
                              styles={{
                                tooltip: {
                                  fontSize: '0.75rem',
                                  whiteSpace: 'pre-line',
                                  backgroundColor: '#1e293b',
                                  color: '#f1f5f9',
                                },
                              }}
                            >
                              <Text
                                size="sm"
                                style={{
                                  cursor: 'pointer',
                                  lineHeight: 1.5,
                                  padding: '4px 0',
                                  borderBottom: '1px dotted #cbd5e1',
                                }}
                              >
                                {summary}
                              </Text>
                            </Tooltip>
                          ) : (
                            <Text size="sm" c="dimmed" fs="italic" style={{ textAlign: 'center' }}>
                              —
                            </Text>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </Table>
          </Box>
        </Paper>
      )}
    </Stack>
  );
}