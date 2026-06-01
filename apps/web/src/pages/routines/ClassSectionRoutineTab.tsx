import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, Button, Group, Card, Text, Loader, Badge, Grid, Paper, ScrollArea, Box, Title, Alert, Tooltip, Stack, ThemeIcon } from '@mantine/core';
import { IconSchool, IconRefresh, IconUser, IconBook, IconCalendar } from '@tabler/icons-react';
import { api } from '../../lib/api';
import { ClassSection, AcademicSeason, Teacher } from '../../lib/types';
import { TeacherDetailModal } from './TeacherDetailModal';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_ABBR = { Monday: 'M', Tuesday: 'T', Wednesday: 'W', Thursday: 'Th', Friday: 'F' };

export function ClassSectionRoutineTab() {
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: seasons } = useQuery<AcademicSeason[]>({
    queryKey: ['seasons'],
    queryFn: () => api.get('/academic-seasons').then(res => res.data),
  });

  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then(res => res.data),
  });

  const { data: classSections, isLoading, refetch } = useQuery<ClassSection[]>({
    queryKey: ['classSections', selectedSeasonId],
    queryFn: () => api.get(`/class-sections?seasonId=${selectedSeasonId}`).then(res => res.data),
    enabled: !!selectedSeasonId,
  });

  // Build schedule matrix from the new data structure
  const scheduleMatrix = useMemo(() => {
    if (!classSections) return [];
    const matrix = [];

    for (const cs of classSections) {
      const className = (cs.classId as any)?.displayName || 'Unknown Class';
      const periodCount = 7; // Default max periods

      for (const section of cs.sections) {
        const sectionName = section.name;
        const periodsData = [];

        // Get all period teachers from the new structure
        for (const periodTeacher of section.periodTeachers || []) {
          const period = periodTeacher.period;
          // Find active assignment (no end date)
          const activeAssignment = periodTeacher.assignments?.find(a => !a.endDate);
          
          if (activeAssignment) {
            const teacher = teachers?.find(t => t._id === activeAssignment.teacherId);
            periodsData.push({
              period,
              subject: periodTeacher.subject,
              teacher: teacher?.name || 'Unknown',
              teacherId: activeAssignment.teacherId,
              days: activeAssignment.days,
            });
          }
        }

        // Sort by period
        periodsData.sort((a, b) => a.period - b.period);

        matrix.push({
          id: `${className}|${sectionName}`,
          className,
          sectionName,
          periodsData,
          periodCount,
        });
      }
    }
    return matrix.sort((a, b) => a.className.localeCompare(b.className));
  }, [classSections, teachers]);

  const maxPeriods = useMemo(() => {
    if (scheduleMatrix.length === 0) return 7;
    return Math.max(...scheduleMatrix.map(row => row.periodCount));
  }, [scheduleMatrix]);

  const handleTeacherClick = (teacherName: string) => {
    const teacher = teachers?.find(t => t.name === teacherName);
    if (teacher) {
      setSelectedTeacher(teacher);
      setModalOpen(true);
    }
  };

  if (isLoading) return <Loader />;

  return (
    <Stack>
      <Card withBorder shadow="sm" p="md" radius="md">
        <Grid>
          <Grid.Col span={8}>
            <Select
              label="Academic Season"
              placeholder="Select season"
              data={seasons?.map(s => ({ value: s._id, label: s.name })) || []}
              value={selectedSeasonId}
              onChange={setSelectedSeasonId}
              required
              searchable
              clearable
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Button leftSection={<IconRefresh size={16} />} onClick={() => refetch()} fullWidth mt={28} variant="light">
              Refresh
            </Button>
          </Grid.Col>
        </Grid>
      </Card>

      {!selectedSeasonId && (
        <Alert color="blue" title="Select Season">Please select an academic season to view the routine.</Alert>
      )}

      {selectedSeasonId && scheduleMatrix.length > 0 && (
        <Paper withBorder shadow="sm" radius="md" style={{ overflow: 'hidden' }}>
          <Box style={{ padding: '12px 16px', borderBottom: '1px solid #e9ecef', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Group justify="space-between">
              <Group>
                <ThemeIcon size={24} color="white" variant="transparent"><IconSchool size={24} /></ThemeIcon>
                <Title order={3} c="white">Class & Section Routine</Title>
              </Group>
              <Badge size="lg" variant="white" color="dark">{scheduleMatrix.length} Classes/Sections</Badge>
            </Group>
          </Box>
          <ScrollArea style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9' }}>
                  <th style={{ position: 'sticky', left: 0, backgroundColor: '#f1f5f9', minWidth: 180, padding: '14px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
                    Class & Section
                  </th>
                  <th style={{ position: 'sticky', left: 180, backgroundColor: '#f1f5f9', minWidth: 100, padding: '14px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
                    Class Teacher
                  </th>
                  {Array.from({ length: maxPeriods }).map((_, i) => (
                    <th key={i} style={{ minWidth: 180, textAlign: 'center', padding: '14px', border: '1px solid #e2e8f0', fontWeight: 600, backgroundColor: '#f1f5f9' }}>
                      Period {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scheduleMatrix.map((row, rowIdx) => {
                  const cs = classSections?.find(c => 
                    c.sections.some(s => s.name === row.sectionName && (c.classId as any)?.displayName === row.className)
                  );
                  const section = cs?.sections?.find(s => s.name === row.sectionName);
                  const classTeacher = teachers?.find(t => t._id === section?.currentClassTeacherId);
                  
                  return (
                    <tr key={row.id} style={{ backgroundColor: rowIdx % 2 === 0 ? '#ffffff' : '#fafcff' }}>
                      <td style={{ position: 'sticky', left: 0, backgroundColor: 'inherit', fontWeight: 600, padding: '12px', border: '1px solid #e2e8f0' }}>
                        <Group gap={4}>
                          <IconSchool size={14} color="blue" />
                          <Text size="sm" fw={600}>{row.className} - {row.sectionName}</Text>
                        </Group>
                      </td>
                      <td style={{ position: 'sticky', left: 180, backgroundColor: 'inherit', padding: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        {classTeacher ? (
                          <Tooltip label="Click to view teacher details">
                            <Button
                              variant="subtle"
                              size="compact-xs"
                              onClick={() => handleTeacherClick(classTeacher.name)}
                              style={{ fontSize: '11px' }}
                            >
                              {classTeacher.name}
                            </Button>
                          </Tooltip>
                        ) : <Text c="dimmed" size="sm">—</Text>}
                      </td>
                      {Array.from({ length: maxPeriods }).map((_, periodIdx) => {
                        const periodData = row.periodsData.find(p => p.period === periodIdx + 1);
                        const hasData = periodData && periodData.subject;
                        return (
                          <td key={periodIdx} style={{ textAlign: 'center', verticalAlign: 'middle', padding: '12px', border: '1px solid #e2e8f0' }}>
                            {hasData ? (
                              <div>
                                <Badge color="green" variant="light" size="sm" mb={4}>{periodData.subject}</Badge>
                                <Tooltip label={`Days: ${periodData.days.join(', ')}`}>
                                  <Button
                                    variant="subtle"
                                    size="compact-xs"
                                    onClick={() => handleTeacherClick(periodData.teacher)}
                                    style={{ fontSize: '11px', fontWeight: 500, height: 'auto', padding: '2px 6px' }}
                                  >
                                    {periodData.teacher}
                                  </Button>
                                </Tooltip>
                                <Text size="xs" c="dimmed" mt={2}>{periodData.days.join(', ')}</Text>
                              </div>
                            ) : <Text c="dimmed" size="sm" fs="italic">—</Text>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollArea>
        </Paper>
      )}

      {selectedTeacher && (
        <TeacherDetailModal teacher={selectedTeacher} opened={modalOpen} onClose={() => setModalOpen(false)} />
      )}
    </Stack>
  );
}