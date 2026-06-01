import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, Button, Group, Card, Text, Loader, Badge, Grid, Paper, ScrollArea, Box, Title, Alert, Tooltip, Stack, ThemeIcon } from '@mantine/core';
import { IconSchool, IconRefresh, IconUser, IconBook, IconCalendar } from '@tabler/icons-react';
import { api } from '../../lib/api';
import { ClassSection, AcademicSeason, Teacher, Subject } from '../../lib/types';
import { TeacherDetailModal } from './TeacherDetailModal';

const DAY_MAP: Record<string, string> = {
  M: 'Mon', T: 'Tue', W: 'Wed', Th: 'Thu', F: 'Fri'
};

export function ClassSectionRoutineTab() {
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const schoolId = user.schoolId;

  const { data: seasons } = useQuery<AcademicSeason[]>({
    queryKey: ['seasons', schoolId],
    queryFn: () => api.get('/academic-seasons', { headers: { 'X-School-Id': schoolId } }).then(res => res.data),
    enabled: !!schoolId,
  });

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

  const { data: sections, isLoading, refetch } = useQuery({
    queryKey: ['sections', selectedSeasonId, schoolId],
    queryFn: () => api.get('/sections', { 
      params: { seasonId: selectedSeasonId },
      headers: { 'X-School-Id': schoolId } 
    }).then(res => res.data),
    enabled: !!selectedSeasonId && !!schoolId,
  });

  // Build schedule matrix
  const scheduleMatrix = useMemo(() => {
    if (!sections) return [];
    const matrix = [];

    for (const section of sections) {
      const className = (section.classId as any)?.displayName || 'Unknown Class';
      const sectionName = section.name;
      const periodCount = (section.classId as any)?.periodCount || 7;
      const periodsData = [];

      // periodTeachers is an object with period numbers as keys
      const periodTeachers = section.periodTeachers || {};
      
      for (let period = 1; period <= periodCount; period++) {
        const assignments = periodTeachers[period] || [];
        const activeAssignments = assignments.filter((a: any) => !a.endDate);
        
        if (activeAssignments.length > 0) {
          // For each active assignment (can be multiple for different days)
          for (const assignment of activeAssignments) {
            let teacherId = assignment.teacherId;
            let subjectId = assignment.subjectId;
            
            if (typeof teacherId === 'object') teacherId = teacherId._id;
            if (typeof subjectId === 'object') subjectId = subjectId._id;
            
            const teacher = teachers?.find(t => t._id === teacherId);
            const subject = subjects?.find(s => s._id === subjectId);
            
            periodsData.push({
              period,
              subject: subject?.name || 'Unknown',
              subjectId,
              teacher: teacher?.name || 'Unknown',
              teacherId,
              days: assignment.days,
            });
          }
        } else {
          periodsData.push({
            period,
            subject: null,
            subjectId: null,
            teacher: null,
            teacherId: null,
            days: [],
          });
        }
      }

      // Group by period for display (multiple teachers per period)
      const groupedByPeriod: Record<number, any[]> = {};
      for (const data of periodsData) {
        if (!groupedByPeriod[data.period]) groupedByPeriod[data.period] = [];
        if (data.subject) groupedByPeriod[data.period].push(data);
      }

      matrix.push({
        id: `${className}|${sectionName}`,
        className,
        sectionName,
        periodCount,
        periodsData: groupedByPeriod,
        classTeacher: section.currentClassTeacherId,
      });
    }
    
    return matrix.sort((a, b) => a.className.localeCompare(b.className));
  }, [sections, teachers, subjects]);

  const maxPeriods = useMemo(() => {
    if (scheduleMatrix.length === 0) return 7;
    return Math.max(...scheduleMatrix.map(row => row.periodCount));
  }, [scheduleMatrix]);

  const getClassTeacherName = (section: any) => {
    if (!section?.classTeacher) return null;
    let teacherId = section.classTeacher;
    if (typeof teacherId === 'object') teacherId = teacherId._id;
    return teachers?.find(t => t._id === teacherId);
  };

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
              leftSection={<IconCalendar size={16} />}
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
          <Box style={{ padding: '12px 16px', borderBottom: '1px solid #e9ecef', background: 'linear-gradient(135deg, #1e5a7a 0%, #0e3a52 100%)' }}>
            <Group justify="space-between">
              <Group>
                <ThemeIcon size={24} color="white" variant="transparent"><IconSchool size={24} /></ThemeIcon>
                <Title order={3} c="white">Class & Section Routine</Title>
              </Group>
              <Badge size="lg" variant="light" color="white" style={{ background: 'rgba(255,255,255,0.2)' }}>
                {scheduleMatrix.length} Classes/Sections
              </Badge>
            </Group>
          </Box>
          <ScrollArea style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9' }}>
                  <th style={{ position: 'sticky', left: 0, backgroundColor: '#f1f5f9', minWidth: 180, padding: '14px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
                    Class & Section
                  </th>
                  <th style={{ position: 'sticky', left: 180, backgroundColor: '#f1f5f9', minWidth: 120, padding: '14px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
                    Class Teacher
                  </th>
                  {Array.from({ length: maxPeriods }).map((_, i) => (
                    <th key={i} style={{ minWidth: 200, textAlign: 'center', padding: '14px', border: '1px solid #e2e8f0', fontWeight: 600, backgroundColor: '#f1f5f9' }}>
                      Period {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scheduleMatrix.map((row, rowIdx) => {
                  const classTeacher = getClassTeacherName(row);
                  
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
                        const periodNum = periodIdx + 1;
                        const assignments = row.periodsData[periodNum] || [];
                        
                        return (
                          <td key={periodIdx} style={{ textAlign: 'center', verticalAlign: 'middle', padding: '12px', border: '1px solid #e2e8f0' }}>
                            {assignments.length > 0 ? (
                              <Stack gap={4} align="center">
                                {assignments.map((assignment, idx) => (
                                  <div key={idx}>
                                    <Badge color="green" variant="light" size="sm" mb={2}>{assignment.subject}</Badge>
                                    <Tooltip label={`Days: ${assignment.days.join(', ')}`}>
                                      <Button
                                        variant="subtle"
                                        size="compact-xs"
                                        onClick={() => handleTeacherClick(assignment.teacher)}
                                        style={{ fontSize: '11px', fontWeight: 500, height: 'auto', padding: '2px 6px' }}
                                      >
                                        {assignment.teacher}
                                      </Button>
                                    </Tooltip>
                                    <Text size="xs" c="dimmed" mt={2}>{assignment.days.map(d => DAY_MAP[d]).join(', ')}</Text>
                                  </div>
                                ))}
                              </Stack>
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

      {selectedSeasonId && scheduleMatrix.length === 0 && !isLoading && (
        <Alert color="yellow" title="No Data">No sections found for the selected season.</Alert>
      )}

      {selectedTeacher && (
        <TeacherDetailModal teacher={selectedTeacher} opened={modalOpen} onClose={() => setModalOpen(false)} />
      )}
    </Stack>
  );
}