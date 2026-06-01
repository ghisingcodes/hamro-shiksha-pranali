import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Select, Button, Group, Title, Stack, Loader, Alert, 
  Badge, ActionIcon, SimpleGrid, Card, Text, ThemeIcon, 
  Tooltip, Modal, TextInput, Divider, Paper, Center
} from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconBooks, IconFilter, IconSchool, IconBook, IconRefresh } from '@tabler/icons-react';
import { api } from '../../../lib/api';
import { notifications } from '@mantine/notifications';
import { AcademicSeason, Class, Subject } from '../../../lib/types';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

interface SubjectsTabProps {
  selectedSeasonId: string;
  onSeasonChange: (seasonId: string) => void;
}

export function SubjectsTab({ selectedSeasonId, onSeasonChange }: SubjectsTabProps) {
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '' });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const schoolId = user.schoolId;

  // Debug: Log user and schoolId
  useEffect(() => {
    console.log('SubjectsTab - SchoolId:', schoolId);
  }, [schoolId]);

  // Fetch seasons
  const { data: seasons = [], isLoading: seasonsLoading, error: seasonsError } = useQuery<AcademicSeason[]>({
    queryKey: ['seasons', schoolId],
    queryFn: async () => {
      console.log('Fetching seasons...');
      const response = await api.get('/academic-seasons', { 
        headers: { 'X-School-Id': schoolId } 
      });
      console.log('Seasons response:', response.data);
      return response.data;
    },
    enabled: !!schoolId,
  });

  // Auto-select active season
  useEffect(() => {
    if (seasons && seasons.length > 0 && !selectedSeasonId) {
      const activeSeason = seasons.find(s => s.isActive);
      if (activeSeason) {
        console.log('Auto-selecting active season:', activeSeason._id);
        onSeasonChange(activeSeason._id);
      } else if (seasons[0]) {
        console.log('Auto-selecting first season:', seasons[0]._id);
        onSeasonChange(seasons[0]._id);
      }
    }
  }, [seasons, selectedSeasonId, onSeasonChange]);

  // Fetch classes
  const { data: classes = [], isLoading: classesLoading, error: classesError } = useQuery<Class[]>({
    queryKey: ['classes', schoolId],
    queryFn: async () => {
      console.log('Fetching classes...');
      const response = await api.get('/classes', { 
        headers: { 'X-School-Id': schoolId } 
      });
      console.log('Classes response:', response.data);
      return response.data;
    },
    enabled: !!schoolId,
  });

  // Fetch subjects with debug logging
  const { data: subjects = [], refetch, isLoading: subjectsLoading, error: subjectsError } = useQuery<Subject[]>({
    queryKey: ['subjects', selectedSeasonId, selectedClassId, schoolId],
    queryFn: async () => {
      if (!selectedSeasonId || !selectedClassId) {
        console.log('Skipping subjects fetch - missing season or class');
        return [];
      }
      
      console.log('=== SUBJECTS FETCH DEBUG ===');
      console.log('Selected Season ID:', selectedSeasonId);
      console.log('Selected Class ID:', selectedClassId);
      console.log('School ID:', schoolId);
      
      try {
        const params = new URLSearchParams();
        params.append('seasonId', selectedSeasonId);
        params.append('classId', selectedClassId);
        
        const url = `/subjects?${params.toString()}`;
        console.log('Request URL:', url);
        
        const response = await api.get(url, { 
          headers: { 'X-School-Id': schoolId } 
        });
        
        console.log('Subjects API response status:', response.status);
        console.log('Subjects API response data:', response.data);
        console.log('Subjects count:', response.data?.length || 0);
        
        return response.data || [];
      } catch (err: any) {
        console.error('Error fetching subjects:', err);
        console.error('Error response:', err.response?.data);
        throw err;
      }
    },
    enabled: !!selectedSeasonId && !!selectedClassId && !!schoolId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Creating subject with data:', data);
      console.log('Selected Class ID:', selectedClassId);
      console.log('Selected Season ID:', selectedSeasonId);
      
      const payload = { 
        ...data, 
        classId: selectedClassId, 
        seasonId: selectedSeasonId, 
        schoolId 
      };
      
      const response = await api.post('/subjects', payload);
      console.log('Create subject response:', response.data);
      return response.data;
    },
    onSuccess: () => { 
      refetch(); 
      setModalOpen(false); 
      setFormData({ name: '', code: '' }); 
      notifications.show({ title: 'Success', message: 'Subject added', color: 'green' }); 
    },
    onError: (err: any) => {
      console.error('Create subject error:', err);
      console.error('Error response:', err.response?.data);
      notifications.show({ 
        title: 'Error', 
        message: err.response?.data?.message || 'Failed to add subject', 
        color: 'red' 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      console.log('Updating subject:', id, data);
      const response = await api.put(`/subjects/${id}`, data);
      return response.data;
    },
    onSuccess: () => { 
      refetch(); 
      setModalOpen(false); 
      setEditingSubject(null); 
      notifications.show({ title: 'Success', message: 'Subject updated', color: 'green' }); 
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting subject:', id);
      const response = await api.delete(`/subjects/${id}`);
      return response.data;
    },
    onSuccess: () => { 
      refetch(); 
      notifications.show({ title: 'Success', message: 'Subject deleted', color: 'green' }); 
    },
  });

  const selectedClass = classes?.find(c => c._id === selectedClassId);
  const activeSeason = seasons?.find(s => s.isActive);
  const currentSeasonName = seasons?.find(s => s._id === selectedSeasonId)?.name;

  // Debug: Log state changes
  useEffect(() => {
    console.log('SubjectsTab State:', {
      selectedSeasonId,
      selectedClassId,
      subjectsCount: subjects.length,
      subjectsError: subjectsError?.message,
      schoolId
    });
  }, [selectedSeasonId, selectedClassId, subjects, subjectsError, schoolId]);

  if (seasonsLoading || classesLoading) {
    return (
      <Center h={300}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (seasonsError || classesError) {
    return (
      <Alert color="red" title="Error loading data">
        {seasonsError?.message || classesError?.message}
      </Alert>
    );
  }

  return (
    <Stack gap="xl">
      {/* Filter Section */}
      <Paper withBorder shadow="sm" radius="md" p="lg">
        <Group justify="space-between" mb="md">
          <Group>
            <ThemeIcon size="md" color="violet" variant="light" radius="xl">
              <IconFilter size={18} />
            </ThemeIcon>
            <Title order={4}>Filter Subjects</Title>
          </Group>
          <Group>
            {activeSeason && (
              <Badge size="lg" color="green" variant="light">
                Active Season: {activeSeason.name}
              </Badge>
            )}
            <Tooltip label="Refresh">
              <ActionIcon variant="subtle" onClick={() => refetch()} disabled={!selectedClassId}>
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
        
        <Group grow align="flex-end">
          <Select
            label="Academic Season"
            placeholder="Select season"
            data={seasons.map((s: any) => ({ value: s._id, label: `${s.name} ${s.isActive ? '(Active)' : ''}` }))}
            value={selectedSeasonId}
            onChange={(val) => { 
              console.log('Season changed to:', val);
              onSeasonChange(val || ''); 
              setSelectedClassId(''); 
            }}
            leftSection={<IconSchool size={16} />}
          />
          <Select
            label="Class"
            placeholder="Select class"
            data={classes.map((c: any) => ({ value: c._id, label: c.displayName }))}
            value={selectedClassId}
            onChange={(val) => {
              console.log('Class changed to:', val);
              setSelectedClassId(val || '');
            }}
            disabled={!selectedSeasonId}
            leftSection={<IconBook size={16} />}
          />
          <Button
            leftSection={<IconPlus size={18} />}
            onClick={() => { setEditingSubject(null); setFormData({ name: '', code: '' }); setModalOpen(true); }}
            disabled={!selectedClassId || !selectedSeasonId}
            variant="gradient"
            gradient={{ from: 'violet', to: 'grape' }}
          >
            Add Subject
          </Button>
        </Group>
      </Paper>

      {/* No Selection State */}
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
            <Text size="lg" c="dimmed">Please select a class to view its subjects</Text>
            <Text size="sm" c="dimmed">Season: {currentSeasonName || 'Loading...'}</Text>
          </Stack>
        </Center>
      )}

      {/* Subjects Grid */}
      {selectedClassId && selectedSeasonId && (
        <>
          <Group justify="space-between">
            <div>
              <Group gap="xs">
                <ThemeIcon size="md" color="violet" variant="light" radius="xl">
                  <IconBooks size={18} />
                </ThemeIcon>
                <Title order={3}>{selectedClass?.displayName || 'Class'}</Title>
              </Group>
              <Text size="sm" c="dimmed" mt={4}>
                Season: {currentSeasonName || 'Loading...'}
              </Text>
            </div>
            <Badge size="lg" variant="gradient" gradient={{ from: 'violet', to: 'grape' }}>
              {subjects.length} Subject{subjects.length !== 1 ? 's' : ''}
            </Badge>
          </Group>

          {subjectsLoading && (
            <Center py={50}>
              <Loader size="md" />
            </Center>
          )}

          {subjectsError && (
            <Alert color="red" title="Error loading subjects" onClose={() => refetch()} withCloseButton>
              {subjectsError.message}
              <pre style={{ marginTop: 8, fontSize: 12 }}>
                {JSON.stringify(subjectsError, null, 2)}
              </pre>
            </Alert>
          )}

          {!subjectsLoading && !subjectsError && subjects.length === 0 && (
            <Center py={50}>
              <Stack align="center">
                <ThemeIcon size={60} radius="xl" color="yellow" variant="light">
                  <IconBooks size={30} />
                </ThemeIcon>
                <Text size="lg" c="dimmed">No subjects added yet</Text>
                <Text size="sm" c="dimmed">Click "Add Subject" to create your first subject</Text>
                <Button 
                  variant="light" 
                  leftSection={<IconPlus size={16} />}
                  onClick={() => { setEditingSubject(null); setFormData({ name: '', code: '' }); setModalOpen(true); }}
                >
                  Add First Subject
                </Button>
              </Stack>
            </Center>
          )}

          {!subjectsLoading && !subjectsError && subjects.length > 0 && (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
              {subjects.map((subject: Subject, idx: number) => (
                <motion.div
                  key={subject._id}
                  custom={idx}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card withBorder shadow="sm" radius="md" padding="lg">
                    <Group justify="space-between" align="flex-start">
                      <Group gap="sm">
                        <ThemeIcon size="lg" color="violet" variant="light" radius="xl">
                          <IconBooks size={20} />
                        </ThemeIcon>
                        <div>
                          <Text size="md" fw={600} lineClamp={1}>{subject.name}</Text>
                          {subject.code && (
                            <Text size="xs" c="dimmed" tt="uppercase">{subject.code}</Text>
                          )}
                        </div>
                      </Group>
                      <Group gap={4}>
                        <Tooltip label="Edit Subject">
                          <ActionIcon 
                            variant="subtle" 
                            color="blue" 
                            onClick={() => { 
                              setEditingSubject(subject); 
                              setFormData({ name: subject.name, code: subject.code || '' }); 
                              setModalOpen(true); 
                            }}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete Subject">
                          <ActionIcon 
                            variant="subtle" 
                            color="red" 
                            onClick={() => {
                              if (confirm(`Delete subject "${subject.name}"?`)) {
                                deleteMutation.mutate(subject._id);
                              }
                            }}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>
                    
                    <Divider my="sm" />
                    
                    <Group gap="xs" mt="xs">
                      <Badge size="sm" color="gray" variant="light">
                        ID: {subject._id.slice(-8)}
                      </Badge>
                      <Badge size="sm" color={subject.isActive ? 'green' : 'red'} variant="light">
                        {subject.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </Group>
                  </Card>
                </motion.div>
              ))}
            </SimpleGrid>
          )}
        </>
      )}

      {/* Add/Edit Subject Modal */}
      <Modal 
        opened={modalOpen} 
        onClose={() => {
          setModalOpen(false);
          setEditingSubject(null);
          setFormData({ name: '', code: '' });
        }} 
        title={
          <Group gap="sm">
            <ThemeIcon size="md" color="violet" variant="light" radius="xl">
              {editingSubject ? <IconEdit size={18} /> : <IconPlus size={18} />}
            </ThemeIcon>
            <Title order={4}>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</Title>
          </Group>
        } 
        size="md"
      >
        <TextInput 
          label="Subject Name" 
          placeholder="e.g., Mathematics, Science, English" 
          value={formData.name} 
          onChange={e => setFormData({ ...formData, name: e.target.value })} 
          required 
          data-autofocus
        />
        <TextInput 
          label="Subject Code (optional)" 
          placeholder="e.g., MATH101, SCI201" 
          value={formData.code} 
          onChange={e => setFormData({ ...formData, code: e.target.value })} 
          mt="md"
        />
        {selectedClass && (
          <div style={{ marginTop: 12 }}>
            <Text size="xs" c="dimmed">
              Adding to: {selectedClass.displayName} ({currentSeasonName})
            </Text>
          </div>
        )}
        <Divider my="md" />
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button 
            gradient={{ from: 'violet', to: 'grape' }} 
            variant="gradient"
            onClick={() => {
              if (!formData.name.trim()) {
                notifications.show({ title: 'Error', message: 'Subject name is required', color: 'red' });
                return;
              }
              if (editingSubject) {
                updateMutation.mutate({ id: editingSubject._id, data: formData });
              } else {
                createMutation.mutate(formData);
              }
            }}
          >
            {editingSubject ? 'Update Subject' : 'Create Subject'}
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}