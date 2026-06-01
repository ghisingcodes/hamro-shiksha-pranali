import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, Button, Group, Card, Text, Loader, Badge, Grid, Paper, ScrollArea, Box, Title, Alert, ActionIcon, Tooltip, Stack, Divider, ThemeIcon } from '@mantine/core';
import { IconUser, IconCalendar, IconRefresh, IconEye, IconSchool, IconClock, IconBook } from '@tabler/icons-react';
import { api } from '../../lib/api';
import { Teacher, AcademicSeason, Subject } from '../../lib/types';
import { TeacherDetailModal } from './TeacherDetailModal';

const DAY_MAP: Record<string, string> = {
  M: 'Mon', T: 'Tue', W: 'Wed', Th: 'Thu', F: 'Fri'
};

export function TeacherRoutineTab() {
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedTeacherDetails, setSelectedTeacherDetails] = useState<Teacher | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const schoolId = user.schoolId;

  const { data: seasons } = useQuery<AcademicSeason[]>({
    queryKey: ['seasons', schoolId],
    queryFn: () => api.get('/academic-seasons', { headers: { 'X-School-Id': schoolId } }).then(res => res.data),
    enabled: !!schoolId,
  });

  // Auto-select latest season
  useEffect(() => {
    if (seasons && seasons.length > 0 && !selectedSeasonId) {
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
    queryKey: ['teachers', schoolId],
    queryFn: () => api.get('/teachers', { headers: { 'X-School-Id': schoolId } }).then(res => res.data),
    enabled: !!schoolId,
  });

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ['subjects', selectedSeasonId, schoolId],
    queryFn: () => api.get('/subjects', { 
      params: { seasonId: selectedSeasonId },
      headers: { 'X-School-Id': schoolId } 
    }).then(res => res.data),
    enabled: !!selectedSeasonId && !!schoolId,
  });

  const { data: sections, refetch, isLoading, isError } = useQuery({
    queryKey: ['sections', selectedSeasonId, schoolId],
    queryFn: () => api.get('/sections', { 
      params: { seasonId: selectedSeasonId },
      headers: { 'X-School-Id': schoolId } 
    }).then(res => res.data),
    enabled: !!selectedSeasonId && !!schoolId,
  });

  // Build schedule from sections structure
  const scheduleRows = useMemo(() => {
    if (!sections || !selectedTeacherId || !subjects) return [];

    const periodMap = new Map<number, any[]>();

    for (const section of sections) {
      const className = (section.classId as any)?.displayName || 'Unknown Class';
      const sectionName = section.name;
      const periodTeachers = section.periodTeachers || {};
      
      for (const [periodStr, assignments] of Object.entries(periodTeachers)) {
        const period = parseInt(periodStr);
        const activeAssignment = (assignments as any[]).find(
          (a: any) => !a.endDate && a.teacherId === selectedTeacherId
        );
        
        if (activeAssignment) {
          const subject = subjects.find(s => s._id === activeAssignment.subjectId);
          
          if (!periodMap.has(period)) {
            periodMap.set(period, []);
          }
          periodMap.get(period)!.push({
            className,
            sectionName,
            subject: subject?.name || 'Unknown',
            days: activeAssignment.days,
          });
        }
      }
    }
    
    const periods = Array.from(periodMap.keys()).sort((a, b) => a - b);
    return periods.map(period => ({
      period,
      entries: periodMap.get(period)!,
    }));
  }, [sections, selectedTeacherId, subjects]);

  useEffect(() => {
    if (selectedTeacherId && teachers) {
      const teacher = teachers.find(t => t._id === selectedTeacherId);
      setSelectedTeacherDetails(teacher || null);
    }
    if (selectedTeacherId && selectedSeasonId) {
      refetch();
    }
  }, [selectedTeacherId, selectedSeasonId, teachers]);

  if (isError) return <Alert color="red">Failed to load schedule. Please try again later.</Alert>;

  const teacherOptions = useMemo(() => {
    if (!teachers) return [];
    return teachers.map(teacher => ({ 
      value: teacher._id, 
      label: `${teacher.name}` 
    }));
  }, [teachers]);

  return (
    <Stack gap="md">
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
              nothingFoundMessage="No teachers found"
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
            <Button leftSection={<IconRefresh size={18} />} onClick={() => refetch()} loading={isLoading} fullWidth mt={28} variant="light">
              Refresh
            </Button>
          </Grid.Col>
        </Grid>
      </Card>

      {selectedTeacherDetails && (
        <Card withBorder shadow="sm" p="md" radius="md" bg="blue.0">
          <Group justify="space-between">
            <Group>
              <ThemeIcon size={28} color="blue" variant="light"><IconUser size={20} /></ThemeIcon>
              <div>
                <Title order={3}>{selectedTeacherDetails.name}</Title>
                <Text size="sm" c="dimmed">Teacher ID: {selectedTeacherDetails._id.slice(-8)}</Text>
              </div>
              <ActionIcon variant="light" color="blue" onClick={() => setDetailModalOpen(true)}>
                <IconEye size={18} />
              </ActionIcon>
            </Group>
            <Badge size="lg" variant="filled" color="blue">{scheduleRows.length} Periods</Badge>
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
          <Box style={{ padding: '12px 16px', borderBottom: '1px solid #e9ecef', background: 'linear-gradient(135deg, #1e5a7a 0%, #0e3a52 100%)' }}>
            <Group gap="md">
              <IconClock size={24} color="white" />
              <Title order={3} c="white">Weekly Schedule</Title>
              <Badge size="lg" variant="light" color="white" style={{ background: 'rgba(255,255,255,0.2)' }}>{selectedTeacherDetails?.name}</Badge>
            </Group>
          </Box>
          <ScrollArea style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 400px)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9' }}>
                  <th style={{ position: 'sticky', left: 0, backgroundColor: '#f1f5f9', minWidth: 80, padding: '14px', border: '1px solid #e2e8f0', fontWeight: 700 }}>Period</th>
                  <th style={{ minWidth: 180, padding: '14px', border: '1px solid #e2e8f0', fontWeight: 700, backgroundColor: '#f1f5f9' }}>Class</th>
                  <th style={{ minWidth: 100, padding: '14px', border: '1px solid #e2e8f0', fontWeight: 700, backgroundColor: '#f1f5f9' }}>Section</th>
                  <th style={{ minWidth: 150, padding: '14px', border: '1px solid #e2e8f0', fontWeight: 700, backgroundColor: '#f1f5f9' }}>Subject</th>
                  <th style={{ minWidth: 180, padding: '14px', border: '1px solid #e2e8f0', fontWeight: 700, backgroundColor: '#f1f5f9' }}>Days</th>
                </tr>
              </thead>
              <tbody>
                {scheduleRows.map((row) => {
                  const totalEntries = row.entries.length;
                  
                  return row.entries.map((entry, entryIdx) => {
                    const isFirstRow = entryIdx === 0;
                    
                    return (
                      <tr key={`${row.period}-${entryIdx}`} style={{ backgroundColor: row.period % 2 === 0 ? '#ffffff' : '#fafcff' }}>
                        {isFirstRow && (
                          <td rowSpan={totalEntries} style={{ position: 'sticky', left: 0, backgroundColor: '#ffffff', textAlign: 'center', verticalAlign: 'middle', padding: '16px', border: '1px solid #e2e8f0' }}>
                            <Badge size="xl" variant="filled" color="blue" radius="md" style={{ fontSize: '14px', padding: '6px 12px' }}>
                              {row.period}
                            </Badge>
                          </td>
                        )}
                        <td style={{ padding: '12px', border: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                          <Text component="div" fw={500}>{entry.className}</Text>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                          <Text component="div" size="sm" c="dimmed">{entry.sectionName}</Text>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                          <Badge color="green" variant="light" size="sm">{entry.subject}</Badge>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                          <Group gap={4}>
                            {entry.days.map((day) => (
                              <Tooltip key={day} label={day} withArrow>
                                <Badge size="sm" variant="outline" color="blue" radius="xl">{DAY_MAP[day] || day}</Badge>
                              </Tooltip>
                            ))}
                          </Group>
                        </td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </ScrollArea>
        </Paper>
      )}

      {scheduleRows.length > 0 && (
        <Card withBorder shadow="sm" p="md" radius="md" bg="gray.0">
          <Title order={4} mb="md">Schedule Summary</Title>
          <Grid>
            <Grid.Col span={4}>
              <div style={{ textAlign: 'center' }}>
                <Text fw={700} size="xl" component="div">{scheduleRows.length}</Text>
                <Text size="sm" c="dimmed" component="div">Total Periods</Text>
              </div>
            </Grid.Col>
            <Grid.Col span={4}>
              <div style={{ textAlign: 'center' }}>
                <Text fw={700} size="xl" component="div">{scheduleRows.reduce((sum, row) => sum + row.entries.length, 0)}</Text>
                <Text size="sm" c="dimmed" component="div">Class Assignments</Text>
              </div>
            </Grid.Col>
            <Grid.Col span={4}>
              <div style={{ textAlign: 'center' }}>
                <Text fw={700} size="xl" component="div">{[...new Set(scheduleRows.flatMap(row => row.entries.map(e => e.subject)))].length}</Text>
                <Text size="sm" c="dimmed" component="div">Unique Subjects</Text>
              </div>
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