import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, Button, Group, Card, Text, Loader, Badge, Grid, Paper, ScrollArea, Box, Title, Alert, ActionIcon, Tooltip, Stack, Divider } from '@mantine/core';
import { IconCalendarTime, IconUser, IconCalendar, IconRefresh, IconEye, IconSchool, IconClock } from '@tabler/icons-react';
import { api } from '../../lib/api';
import { Teacher, ClassSection, AcademicSeason } from '../../lib/types';
import { notifications } from '@mantine/notifications';
import { TeacherDetailModal } from './TeacherDetailModal';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_ABBR = ['M', 'T', 'W', 'Th', 'F'];

export function TeacherRoutineTab() {
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedTeacherDetails, setSelectedTeacherDetails] = useState<Teacher | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Fetch seasons and auto-select the latest (most recent startDate or isActive)
  const { data: seasons } = useQuery<AcademicSeason[]>({
    queryKey: ['seasons'],
    queryFn: () => api.get('/academic-seasons').then(res => res.data),
  });

  // Auto-select latest season
  useEffect(() => {
    if (seasons && seasons.length > 0 && !selectedSeasonId) {
      // Find active season first, otherwise get the latest by startDate
      const activeSeason = seasons.find(s => s.isActive);
      if (activeSeason) {
        setSelectedSeasonId(activeSeason._id);
      } else {
        const latestSeason = seasons.reduce((latest, current) => 
          new Date(current.startDate) > new Date(latest.startDate) ? current : latest
        );
        setSelectedSeasonId(latestSeason._id);
      }
    }
  }, [seasons]);

  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then(res => res.data),
  });

  const { data: classSections, refetch, isLoading, isError } = useQuery<ClassSection[]>({
    queryKey: ['classSections', selectedSeasonId],
    queryFn: () => api.get(`/class-sections?seasonId=${selectedSeasonId}`).then(res => res.data),
    enabled: !!selectedSeasonId && !!selectedTeacherId,
  });

  const teacherOptions = useMemo(() => {
    if (!teachers) return [];
    return teachers.map(teacher => ({ value: teacher._id, label: `${teacher.name} (${teacher.teacherId})` }));
  }, [teachers]);

  // Auto-refetch when teacher is selected
  useEffect(() => {
    if (selectedTeacherId && selectedSeasonId) {
      const teacher = teachers?.find(t => t._id === selectedTeacherId);
      setSelectedTeacherDetails(teacher || null);
      refetch();
    }
  }, [selectedTeacherId, selectedSeasonId]);

  // Build schedule: Periods as rows, each row contains Class, Section, Subject, Days
  const scheduleRows = useMemo(() => {
    if (!classSections || !selectedTeacherDetails) return [];

    const periodMap = new Map(); // period -> array of { className, sectionName, subject, days }
    
    for (const cs of classSections) {
      const className = (cs.classId as any)?.displayName || 'Unknown Class';
      const periodCount = cs.sections[0]?.routine[0]?.length || 7;

      for (const section of cs.sections) {
        const sectionName = section.name;
        
        for (let period = 0; period < periodCount; period++) {
          const periodNum = period + 1;
          const dayInfo = [];
          
          for (let day = 0; day < 5; day++) {
            const entry = section.routine[day]?.[period];
            if (entry && entry.teacher === selectedTeacherDetails.name) {
              dayInfo.push({
                day: day,
                dayAbbr: DAY_ABBR[day],
                subject: entry.subject,
              });
            }
          }
          
          if (dayInfo.length > 0) {
            if (!periodMap.has(periodNum)) {
              periodMap.set(periodNum, []);
            }
            // Group by class-section-subject (might have multiple subjects on different days)
            periodMap.get(periodNum).push({
              className,
              sectionName,
              subject: dayInfo[0].subject,
              days: dayInfo,
              isMultiDay: dayInfo.length > 1,
              subjectsList: [...new Set(dayInfo.map(d => d.subject))],
            });
          }
        }
      }
    }
    
    // Convert to array and sort by period
    const periods = Array.from(periodMap.keys()).sort((a, b) => a - b);
    const rows = [];
    
    for (const period of periods) {
      const entries = periodMap.get(period);
      // If multiple entries for same period, combine them
      rows.push({
        period,
        entries,
      });
    }
    
    return rows;
  }, [classSections, selectedTeacherDetails]);

  if (isError) return <Alert color="red">Failed to load schedule. Please try again later.</Alert>;

  return (
    <Stack>
      <Card withBorder shadow="sm" p="md" radius="md">
        <Grid>
          <Grid.Col span={6}>
            <Select
              label="Select Teacher"
              placeholder="Choose teacher"
              leftSection={<IconUser size={16} />}
              data={teacherOptions}
              value={selectedTeacherId}
              onChange={setSelectedTeacherId}
              searchable
              clearable
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select
              label="Academic Season"
              placeholder="Select season"
              leftSection={<IconCalendar size={16} />}
              data={seasons?.map(s => ({ value: s._id, label: `${s.name} ${s.isActive ? '(Active)' : ''}` })) || []}
              value={selectedSeasonId}
              onChange={setSelectedSeasonId}
              searchable
              clearable
            />
          </Grid.Col>
          <Grid.Col span={2}>
            <Button 
              leftSection={<IconRefresh size={18} />} 
              onClick={() => refetch()} 
              loading={isLoading}
              fullWidth
              mt={28}
              variant="light"
            >
              Refresh
            </Button>
          </Grid.Col>
        </Grid>
      </Card>

      {selectedTeacherDetails && (
        <Card withBorder shadow="sm" p="md" radius="md" bg="blue.0">
          <Group justify="space-between">
            <Group>
              <IconUser size={28} color="blue" />
              <div>
                <Title order={3}>{selectedTeacherDetails.name}</Title>
                <Text size="sm" c="dimmed">Teacher ID: {selectedTeacherDetails.teacherId}</Text>
              </div>
              <ActionIcon variant="light" color="blue" onClick={() => setDetailModalOpen(true)}>
                <IconEye size={18} />
              </ActionIcon>
            </Group>
            <Badge size="lg" variant="filled" color="blue">
              {scheduleRows.length} Periods
            </Badge>
          </Group>
        </Card>
      )}

      {isLoading && <Loader />}

      {!isLoading && scheduleRows.length === 0 && selectedTeacherId && selectedSeasonId && (
        <Alert color="blue" title="No Schedule Found">
          {selectedTeacherDetails?.name} has no classes scheduled for the selected season.
        </Alert>
      )}

      {scheduleRows.length > 0 && (
        <Paper withBorder shadow="sm" radius="md" style={{ overflow: 'hidden' }}>
          <Box style={{ padding: '12px 16px', borderBottom: '1px solid #e9ecef', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Group gap="md">
              <IconClock size={24} color="white" />
              <Title order={3} c="white">Weekly Schedule</Title>
              <Badge size="lg" variant="white" color="dark">
                {selectedTeacherDetails?.name}
              </Badge>
            </Group>
          </Box>
          <ScrollArea style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 400px)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9' }}>
                  <th style={{ position: 'sticky', left: 0, backgroundColor: '#f1f5f9', minWidth: 100, padding: '14px', border: '1px solid #e2e8f0', fontWeight: 700, fontSize: '14px' }}>
                    Period
                  </th>
                  <th style={{ minWidth: 180, padding: '14px', border: '1px solid #e2e8f0', fontWeight: 700, backgroundColor: '#f1f5f9' }}>
                    Class
                  </th>
                  <th style={{ minWidth: 120, padding: '14px', border: '1px solid #e2e8f0', fontWeight: 700, backgroundColor: '#f1f5f9' }}>
                    Section
                  </th>
                  <th style={{ minWidth: 180, padding: '14px', border: '1px solid #e2e8f0', fontWeight: 700, backgroundColor: '#f1f5f9' }}>
                    Subject(s)
                  </th>
                  <th style={{ minWidth: 200, padding: '14px', border: '1px solid #e2e8f0', fontWeight: 700, backgroundColor: '#f1f5f9' }}>
                    Days
                  </th>
                </tr>
              </thead>
              <tbody>
                {scheduleRows.map((row, rowIdx) => (
                  <tr key={row.period} style={{ backgroundColor: rowIdx % 2 === 0 ? '#ffffff' : '#fafcff' }}>
                    <td style={{ 
                      position: 'sticky', 
                      left: 0, 
                      backgroundColor: 'inherit', 
                      fontWeight: 700, 
                      fontSize: '16px',
                      padding: '16px 12px', 
                      border: '1px solid #e2e8f0',
                      textAlign: 'center',
                      verticalAlign: 'middle'
                    }}>
                      <Badge size="xl" variant="filled" color="blue" radius="md" style={{ fontSize: '14px', padding: '6px 12px' }}>
                        {row.period}
                      </Badge>
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                      <Stack gap={8}>
                        {row.entries.map((entry, idx) => (
                          <Text key={idx} fw={500} size="sm">{entry.className}</Text>
                        ))}
                      </Stack>
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                      <Stack gap={8}>
                        {row.entries.map((entry, idx) => (
                          <Text key={idx} size="sm" c="dimmed">{entry.sectionName}</Text>
                        ))}
                      </Stack>
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                      <Stack gap={8}>
                        {row.entries.map((entry, idx) => (
                          <div key={idx}>
                            {entry.subjectsList.length > 1 ? (
                              <Group gap={4}>
                                {entry.subjectsList.map((subj, sIdx) => (
                                  <Badge key={sIdx} color="green" variant="light" size="sm">{subj}</Badge>
                                ))}
                              </Group>
                            ) : (
                              <Badge color="green" variant="light" size="sm">{entry.subject}</Badge>
                            )}
                          </div>
                        ))}
                      </Stack>
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                      <Stack gap={8}>
                        {row.entries.map((entry, idx) => (
                          <Group key={idx} gap={4}>
                            {entry.days.map((day, dIdx) => (
                              <Tooltip key={dIdx} label={`${DAYS[day.day]}: ${day.subject}`} withArrow>
                                <Badge size="sm" variant="outline" color="blue" radius="xl" style={{ cursor: 'pointer' }}>
                                  {day.dayAbbr}
                                </Badge>
                              </Tooltip>
                            ))}
                          </Group>
                        ))}
                      </Stack>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </Paper>
      )}

      {/* Summary Section */}
      {scheduleRows.length > 0 && (
        <Card withBorder shadow="sm" p="md" radius="md" bg="gray.0">
          <Title order={4} mb="md">Schedule Summary</Title>
          <Grid>
            <Grid.Col span={4}>
              <Text ta="center">
                <Text fw={700} size="xl">{scheduleRows.length}</Text>
                <Text size="sm" c="dimmed">Total Periods</Text>
              </Text>
            </Grid.Col>
            <Grid.Col span={4}>
              <Text ta="center">
                <Text fw={700} size="xl">
                  {scheduleRows.reduce((sum, row) => sum + row.entries.length, 0)}
                </Text>
                <Text size="sm" c="dimmed">Total Class Assignments</Text>
              </Text>
            </Grid.Col>
            <Grid.Col span={4}>
              <Text ta="center">
                <Text fw={700} size="xl">
                  {[...new Set(scheduleRows.flatMap(row => 
                    row.entries.flatMap(e => e.subjectsList)
                  ))].length}
                </Text>
                <Text size="sm" c="dimmed">Unique Subjects</Text>
              </Text>
            </Grid.Col>
          </Grid>
        </Card>
      )}

      {selectedTeacherDetails && (
        <TeacherDetailModal teacher={selectedTeacherDetails} opened={detailModalOpen} onClose={() => setDetailModalOpen(false)} />
      )}
    </Stack>
  );
}