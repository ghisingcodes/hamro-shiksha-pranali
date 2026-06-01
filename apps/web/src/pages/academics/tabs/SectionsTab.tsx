import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Select, Button, Group, Title, Stack, Loader, Alert, Card, 
  Text, ActionIcon, Modal, TextInput, SimpleGrid, ThemeIcon, 
  Badge, Tooltip, Divider, Avatar, Center
} from '@mantine/core';
import { IconPlus, IconTrash, IconEdit, IconLayoutGrid, IconUser, IconBook, IconRefresh, IconSchool } from '@tabler/icons-react';
import { api } from '../../../lib/api';
import { notifications } from '@mantine/notifications';
import { AcademicSeason, Class } from '../../../lib/types';

interface SectionsTabProps {
  selectedSeasonId: string;
  onSeasonChange: (seasonId: string) => void;
}

export function SectionsTab({ selectedSeasonId, onSeasonChange }: SectionsTabProps) {
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState('');
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [editingSection, setEditingSection] = useState<{ id: string; name: string } | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const schoolId = user.schoolId;

  // Fetch seasons
  const { data: seasons, isLoading: seasonsLoading } = useQuery<AcademicSeason[]>({
    queryKey: ['seasons', schoolId],
    queryFn: () => api.get('/academic-seasons').then(res => res.data),
    enabled: !!schoolId,
  });

  // Fetch classes
  const { data: classes, isLoading: classesLoading } = useQuery<Class[]>({
    queryKey: ['classes', schoolId],
    queryFn: () => api.get('/classes').then(res => res.data),
    enabled: !!schoolId,
  });

  // Fetch sections
  const { data: sections, refetch, isLoading: sectionsLoading, error } = useQuery({
    queryKey: ['sections', selectedSeasonId, selectedClassId, schoolId],
    queryFn: async () => {
      if (!selectedSeasonId || !selectedClassId) return [];
      console.log('Fetching sections with params:', { seasonId: selectedSeasonId, classId: selectedClassId });
      const res = await api.get(`/sections`, { 
        params: { seasonId: selectedSeasonId, classId: selectedClassId }
      });
      console.log('Sections API response:', res.data);
      return res.data || [];
    },
    enabled: !!selectedSeasonId && !!selectedClassId && !!schoolId,
  });

  // Fetch teachers (for period teachers display)
  const { data: teachers } = useQuery({
    queryKey: ['teachers', schoolId],
    queryFn: () => api.get('/teachers').then(res => res.data),
    enabled: !!schoolId,
  });

  // Fetch subjects (for period teachers display)
  const { data: subjects } = useQuery({
    queryKey: ['subjects', selectedSeasonId, selectedClassId],
    queryFn: () => api.get(`/subjects?seasonId=${selectedSeasonId}&classId=${selectedClassId}`).then(res => res.data),
    enabled: !!selectedSeasonId && !!selectedClassId && !!schoolId,
  });

  // Create section mutation
  const createSectionMutation = useMutation({
    mutationFn: async (name: string) => {
      const payload = {
        classId: selectedClassId,
        seasonId: selectedSeasonId,
        schoolId: schoolId,
        name: name,
      };
      console.log('Creating section with payload:', payload);
      return api.post('/sections', payload);
    },
    onSuccess: () => {
      refetch();
      setAddingSection(false);
      setNewSectionName('');
      notifications.show({ title: 'Success', message: 'Section added', color: 'green' });
    },
    onError: (err: any) => {
      console.error('Create section error:', err.response?.data);
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Failed to add section', color: 'red' });
    },
  });

  // Delete section mutation
  const deleteSectionMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/sections/${id}`),
    onSuccess: () => {
      refetch();
      notifications.show({ title: 'Success', message: 'Section deleted', color: 'green' });
    },
    onError: (err: any) => {
      console.error('Delete section error:', err.response?.data);
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Failed to delete section', color: 'red' });
    },
  });

  // Update section name mutation
  const updateSectionMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.put(`/sections/${id}`, { name }),
    onSuccess: () => {
      refetch();
      setEditingSection(null);
      notifications.show({ title: 'Success', message: 'Section renamed', color: 'green' });
    },
    onError: (err: any) => {
      console.error('Update section error:', err.response?.data);
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Failed to rename section', color: 'red' });
    },
  });

  const selectedClass = classes?.find(c => c._id === selectedClassId);
  const sectionsList = sections || [];

  // Get class teacher from section's currentClassTeacherId and currentClassTeacherSubjectId
  const getClassTeacher = (section: any) => {
    if (!teachers || !subjects) return { teacher: null, subject: null };
    
    // Handle both populated and unpopulated data
    let teacherId = section.currentClassTeacherId;
    let subjectId = section.currentClassTeacherSubjectId;
    
    // If it's an object with _id, extract the string
    if (teacherId && typeof teacherId === 'object') teacherId = teacherId._id;
    if (subjectId && typeof subjectId === 'object') subjectId = subjectId._id;
    
    const teacher = teachers?.find((t: any) => t._id === teacherId);
    const subject = subjects?.find((s: any) => s._id === subjectId);
    
    return { teacher, subject };
  };

  if (seasonsLoading || classesLoading) return <Loader />;

  return (
    <Stack gap="xl">
      {/* Filters */}
      <Card withBorder shadow="sm" radius="md" p="lg">
        <Group grow align="flex-end">
          <Select
            label="Academic Season"
            placeholder="Select season"
            data={seasons?.map(s => ({ value: s._id, label: s.name })) || []}
            value={selectedSeasonId}
            onChange={(val) => { 
              onSeasonChange(val || ''); 
              setSelectedClassId(''); 
            }}
            leftSection={<IconSchool size={16} />}
          />
          <Select
            label="Class"
            placeholder="Select class"
            data={classes?.map(c => ({ value: c._id, label: c.displayName })) || []}
            value={selectedClassId}
            onChange={setSelectedClassId}
            disabled={!selectedSeasonId}
            leftSection={<IconBook size={16} />}
          />
          <Button
            leftSection={<IconPlus size={14} />}
            onClick={() => setAddingSection(true)}
            disabled={!selectedClassId || !selectedSeasonId}
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan' }}
          >
            Add Section
          </Button>
        </Group>
      </Card>

      {/* Refresh Button */}
      <Group justify="flex-end">
        <Tooltip label="Refresh Sections">
          <ActionIcon onClick={() => refetch()} variant="light" size="lg" disabled={!selectedClassId}>
            <IconRefresh size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {/* No Selection States */}
      {!selectedSeasonId && (
        <Center py={50}>
          <Stack align="center">
            <ThemeIcon size={60} radius="xl" color="gray" variant="light">
              <IconSchool size={30} />
            </ThemeIcon>
            <Text size="lg" c="dimmed">Please select an academic season first</Text>
          </Stack>
        </Center>
      )}

      {selectedSeasonId && !selectedClassId && (
        <Center py={50}>
          <Stack align="center">
            <ThemeIcon size={60} radius="xl" color="gray" variant="light">
              <IconBook size={30} />
            </ThemeIcon>
            <Text size="lg" c="dimmed">Please select a class to manage sections</Text>
          </Stack>
        </Center>
      )}

      {/* Error State */}
      {error && (
        <Alert color="red" variant="light" title="Error Loading Sections">
          {error.message}
        </Alert>
      )}

      {/* Loading State */}
      {sectionsLoading && selectedClassId && <Center><Loader /></Center>}

      {/* Sections Display */}
      {selectedClassId && selectedSeasonId && !sectionsLoading && sectionsList.length === 0 && (
        <Alert color="yellow" variant="light">
          No sections added yet. Click "Add Section" to create one.
        </Alert>
      )}

      {selectedClassId && selectedSeasonId && !sectionsLoading && sectionsList.length > 0 && (
        <>
          <Group justify="space-between" mb="md">
            <div>
              <Group gap="xs">
                <ThemeIcon size="lg" color="blue" variant="light" radius="xl">
                  <IconSchool size={18} />
                </ThemeIcon>
                <Title order={3}>{selectedClass?.displayName}</Title>
              </Group>
              <Text size="sm" c="dimmed" ml={40}>Periods: {selectedClass?.periodCount}</Text>
            </div>
            <Badge size="lg" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
              {sectionsList.length} Section{sectionsList.length !== 1 ? 's' : ''}
            </Badge>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {sectionsList.map((section: any, idx: number) => {
              const classTeacher = getClassTeacher(section);
              const isExpanded = expandedSection === section._id;
              const periodCount = Object.keys(section.periodTeachers || {}).length;
              
              return (
                <motion.div
                  key={section._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card 
                    withBorder 
                    shadow="sm" 
                    radius="lg" 
                    padding="lg"
                    style={{ 
                      cursor: 'pointer',
                      background: isExpanded ? 'linear-gradient(135deg, #f0f4ff 0%, #ffffff 100%)' : 'white',
                      border: isExpanded ? '2px solid #667eea' : undefined,
                    }}
                    onClick={() => setExpandedSection(isExpanded ? null : section._id)}
                  >
                    <Group justify="space-between" align="center">
                      <Group>
                        <ThemeIcon size="xl" color="cyan" variant="light" radius="xl">
                          <IconLayoutGrid size={24} />
                        </ThemeIcon>
                        <div>
                          <Text size="xl" fw={700}>Section {section.name}</Text>
                          <Text size="xs" c="dimmed">ID: {section._id.slice(-8)}</Text>
                        </div>
                      </Group>
                      <Group gap="xs">
                        <Tooltip label="Edit Section Name">
                          <ActionIcon 
                            variant="subtle" 
                            color="blue" 
                            onClick={(e) => { e.stopPropagation(); setEditingSection({ id: section._id, name: section.name }); }}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete Section">
                          <ActionIcon 
                            variant="subtle" 
                            color="red" 
                            onClick={(e) => { e.stopPropagation(); 
                              if (confirm(`Delete section "${section.name}" permanently?`)) {
                                deleteSectionMutation.mutate(section._id);
                              }
                            }}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>

                    <Divider my="md" />

                    {/* Class Teacher Info - Using currentClassTeacherId and currentClassTeacherSubjectId */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <Group mb="xs" align="center">
                        <IconUser size={14} color="gray" />
                        <Text size="sm" fw={500}>Class Teacher</Text>
                      </Group>
                      
                      {classTeacher.teacher ? (
                        <Card withBorder radius="md" p="xs" style={{ background: '#e8f0fe' }}>
                          <Group>
                            <Avatar size="md" color="blue" radius="xl">
                              {classTeacher.teacher.name?.charAt(0) || 'T'}
                            </Avatar>
                            <div>
                              <Text size="sm" fw={600}>{classTeacher.teacher.name || 'Unknown Teacher'}</Text>
                              <Text size="xs" c="dimmed">{classTeacher.subject?.name || 'No subject assigned'}</Text>
                            </div>
                          </Group>
                        </Card>
                      ) : (
                        <Alert color="yellow" variant="light" p="xs" radius="md">
                          <Text size="xs">⚠️ No class teacher assigned.</Text>
                          <Text size="xs" c="dimmed" mt={4}>Teacher ID: {section.currentClassTeacherId || 'None'}</Text>
                        </Alert>
                      )}
                    </div>

                    <Divider my="md" />

                    {/* Period Teachers Overview */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <Group justify="space-between" mb="xs">
                        <Group gap="xs">
                          <IconBook size={14} color="gray" />
                          <Text size="sm" fw={500}>Period Teachers</Text>
                        </Group>
                        <Badge size="sm" color={periodCount > 0 ? "blue" : "gray"} variant="light">
                          {periodCount} period{periodCount !== 1 ? 's' : ''}
                        </Badge>
                      </Group>

                      {periodCount === 0 && (
                        <Text size="xs" c="dimmed" ta="center" py="sm">No period teachers assigned</Text>
                      )}

                      {isExpanded && periodCount > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ duration: 0.3 }}
                        >
                          <Stack gap="xs" mt="xs">
                            {Object.entries(section.periodTeachers || {}).map(([period, assignments]: [string, any]) => {
                              const active = assignments?.find((a: any) => !a.endDate);
                              const teacher = teachers?.find((t: any) => t._id === active?.teacherId);
                              const subject = subjects?.find((s: any) => s._id === active?.subjectId);
                              return (
                                <Card key={period} withBorder radius="md" p="xs" style={{ background: '#fafafa' }}>
                                  <Group justify="space-between" wrap="nowrap">
                                    <Badge color="teal" size="sm" variant="filled">Period {period}</Badge>
                                    <Text size="xs" c="dimmed" style={{ flex: 1 }}>{subject?.name || '—'}</Text>
                                    <Text size="xs" fw={500}>{teacher?.name || '—'}</Text>
                                  </Group>
                                  {active?.days && active.days.length > 0 && (
                                    <Text size="xs" c="dimmed" mt={4}>
                                      Days: {active.days.map((d: string) => {
                                        const dayMap: Record<string, string> = { M: 'Mon', T: 'Tue', W: 'Wed', Th: 'Thu', F: 'Fri' };
                                        return dayMap[d];
                                      }).join(', ')}
                                    </Text>
                                  )}
                                </Card>
                              );
                            })}
                          </Stack>
                        </motion.div>
                      )}
                      
                      {!isExpanded && periodCount > 0 && (
                        <Text size="xs" c="dimmed" ta="center" mt="xs">
                          👆 Click to expand
                        </Text>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </SimpleGrid>
        </>
      )}

      {/* Add Section Modal */}
      <Modal opened={addingSection} onClose={() => setAddingSection(false)} title="Add New Section" size="md">
        <TextInput 
          label="Section Name" 
          placeholder="e.g., A, B, Buddha, Araniko" 
          value={newSectionName} 
          onChange={e => setNewSectionName(e.target.value)} 
          required 
          autoFocus
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setAddingSection(false)}>Cancel</Button>
          <Button onClick={() => createSectionMutation.mutate(newSectionName)} loading={createSectionMutation.isPending}>
            Create Section
          </Button>
        </Group>
      </Modal>

      {/* Edit Section Modal */}
      <Modal opened={!!editingSection} onClose={() => setEditingSection(null)} title="Edit Section Name" size="md">
        <TextInput 
          label="Section Name" 
          value={editingSection?.name || ''} 
          onChange={e => setEditingSection({ ...editingSection!, name: e.target.value })} 
          required 
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setEditingSection(null)}>Cancel</Button>
          <Button onClick={() => updateSectionMutation.mutate({ id: editingSection!.id, name: editingSection!.name })} loading={updateSectionMutation.isPending}>
            Save
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}