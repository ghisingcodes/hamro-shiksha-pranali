import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Button, Modal, TextInput, NumberInput, Group, Title, Stack, 
  Loader, Alert, Badge, ActionIcon, SimpleGrid, Card, Text, 
  ThemeIcon, Divider, ScrollArea, Tooltip, Select
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash, IconBooks, IconBuilding } from '@tabler/icons-react';
import { api } from '../../../lib/api';
import { notifications } from '@mantine/notifications';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

export function ClassesTab() {
  const queryClient = useQueryClient();
  const [modalOpen, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    grade: 0,
    periodCount: 5,
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const schoolId = user.schoolId;

  // Fetch seasons
  const { data: seasons } = useQuery({
    queryKey: ['seasons', schoolId],
    queryFn: () => api.get('/academic-seasons', { headers: { 'X-School-Id': schoolId } }).then(res => res.data),
    enabled: !!schoolId,
  });

  // Fetch classes
  const { data: classes, isLoading } = useQuery({
    queryKey: ['classes', schoolId],
    queryFn: () => api.get('/classes', { headers: { 'X-School-Id': schoolId } }).then(res => res.data),
    enabled: !!schoolId,
  });

  // Fetch subjects for the selected season to display in cards
  const { data: allSubjects } = useQuery({
    queryKey: ['subjects', selectedSeasonId, schoolId],
    queryFn: async () => {
      if (!selectedSeasonId) return [];
      console.log('Fetching subjects for season:', selectedSeasonId);
      const response = await api.get('/subjects', { 
        params: { seasonId: selectedSeasonId },
        headers: { 'X-School-Id': schoolId } 
      });
      console.log('Subjects fetched:', response.data?.length);
      return response.data;
    },
    enabled: !!selectedSeasonId && !!schoolId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/classes', data, { headers: { 'X-School-Id': schoolId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      closeModal();
      notifications.show({ title: 'Success', message: 'Class added', color: 'green' });
    },
    onError: (err: any) => {
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Failed to add class', color: 'red' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/classes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      closeModal();
      notifications.show({ title: 'Success', message: 'Class updated', color: 'green' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/classes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      notifications.show({ title: 'Success', message: 'Class deleted', color: 'green' });
    },
  });

  const handleSubmit = () => {
    if (editingClass) {
      updateMutation.mutate({ id: editingClass._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEditModal = (cls: any) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      displayName: cls.displayName,
      grade: cls.grade,
      periodCount: cls.periodCount,
    });
    openModal();
  };

  const getClassSubjects = (classId: string) => {
    if (!allSubjects) return [];
    // Filter subjects where classId matches (handling both ObjectId and string)
    const filtered = allSubjects.filter((s: any) => {
      const subjectClassId = typeof s.classId === 'string' ? s.classId : s.classId?._id;
      return subjectClassId === classId;
    });
    return filtered;
  };

  return (
    <Stack>
      <Group justify="space-between" mb="md">
        <Title order={3}>Global Classes</Title>
        <Group>
          <Select
            placeholder="Filter subjects by Season"
            data={seasons?.map((s: any) => ({ value: s._id, label: s.name })) || []}
            value={selectedSeasonId}
            onChange={setSelectedSeasonId}
            clearable
            style={{ width: 220 }}
          />
          <Button 
            leftSection={<IconPlus size={14} />} 
            onClick={() => { setEditingClass(null); setFormData({ name: '', displayName: '', grade: 0, periodCount: 5 }); openModal(); }}
          >
            Add Class
          </Button>
        </Group>
      </Group>

      {isLoading && <Loader />}
      {classes?.length === 0 && <Alert color="yellow">No classes found. Create your first class.</Alert>}

      {classes && classes.length > 0 && (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {classes.map((cls: any, idx: number) => {
            const classSubjects = getClassSubjects(cls._id);
            return (
              <motion.div
                key={cls._id}
                custom={idx}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card withBorder shadow="sm" radius="lg" padding="lg">
                  <Group justify="space-between" align="flex-start">
                    <Group>
                      <ThemeIcon size="lg" color="blue" variant="light" radius="md">
                        <IconBuilding size={20} />
                      </ThemeIcon>
                      <div>
                        <Text size="lg" fw={700}>{cls.displayName}</Text>
                        <Text size="xs" c="dimmed">{cls.name}</Text>
                      </div>
                    </Group>
                    <Group gap="xs">
                      <Tooltip label="Edit">
                        <ActionIcon variant="subtle" color="blue" onClick={() => openEditModal(cls)}>
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete">
                        <ActionIcon variant="subtle" color="red" onClick={() => deleteMutation.mutate(cls._id)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>

                  <Divider my="sm" />

                  <Group gap="xs" mb="xs" wrap="wrap">
                    <Badge color="green" variant="light">Grade: {cls.grade}</Badge>
                    <Badge color="orange" variant="light">Periods: {cls.periodCount}</Badge>
                    <Badge color={cls.isActive ? 'green' : 'gray'} variant="light">
                      {cls.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Group>

                  <Divider my="sm" />

                  <Group gap="xs" mb="xs" align="center">
                    <IconBooks size={14} color="gray" />
                    <Text size="sm" fw={500}>
                      Subjects {selectedSeasonId ? `(${classSubjects.length})` : '(select season to view)'}
                    </Text>
                  </Group>
                  
                  {!selectedSeasonId ? (
                    <Text size="xs" c="dimmed" ta="center" py="xs">
                      Select a season to see subjects
                    </Text>
                  ) : classSubjects.length === 0 ? (
                    <Text size="xs" c="dimmed" ta="center" py="xs">No subjects added for this season</Text>
                  ) : (
                    <ScrollArea style={{ maxHeight: 100 }}>
                      <Group gap="xs">
                        {classSubjects.map((subj: any) => (
                          <Badge key={subj._id} variant="light" color="violet" size="sm">
                            {subj.name}
                          </Badge>
                        ))}
                      </Group>
                    </ScrollArea>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </SimpleGrid>
      )}

      <Modal opened={modalOpen} onClose={closeModal} title={editingClass ? 'Edit Class' : 'Add Class'} size="md">
        <TextInput 
          label="Name (slug)" 
          value={formData.name} 
          onChange={e => setFormData({...formData, name: e.target.value})} 
          required 
        />
        <TextInput 
          label="Display Name" 
          value={formData.displayName} 
          onChange={e => setFormData({...formData, displayName: e.target.value})} 
          required 
          mt="md" 
        />
        <NumberInput 
          label="Grade (0-12)" 
          value={formData.grade} 
          onChange={val => setFormData({...formData, grade: val || 0})} 
          min={0} 
          max={12} 
          mt="md" 
        />
        <NumberInput 
          label="Period Count (5-7)" 
          value={formData.periodCount} 
          onChange={val => setFormData({...formData, periodCount: val || 5})} 
          min={5} 
          max={7} 
          mt="md" 
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeModal}>Cancel</Button>
          <Button onClick={handleSubmit}>Save</Button>
        </Group>
      </Modal>
    </Stack>
  );
}