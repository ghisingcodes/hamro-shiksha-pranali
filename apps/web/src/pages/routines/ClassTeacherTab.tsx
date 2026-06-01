import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, Card, Text, Title, Center, Select, Button, Group, Table, Badge, Loader, Alert, Modal, Tooltip, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconUserShield, IconUserPlus, IconEdit, IconTrash, IconRefresh, IconSchool } from '@tabler/icons-react';
import { api } from '../../lib/api';
import { ClassSection, AcademicSeason, Teacher } from '../../lib/types';
import { notifications } from '@mantine/notifications';

export function ClassTeacherTab() {
  const queryClient = useQueryClient();
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedClassSectionId, setSelectedClassSectionId] = useState('');
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [assignModalOpen, { open: openAssignModal, close: closeAssignModal }] = useDisclosure(false);

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

  const assignTeacherMutation = useMutation({
    mutationFn: async () => {
      const cs = classSections?.find(c => c._id === selectedClassSectionId);
      if (!cs) throw new Error('Class section not found');
      const sectionIndex = cs.sections.findIndex((s: any) => s.name === cs.sections[selectedSectionIndex]?.name);
      return api.post(`/class-sections/${selectedClassSectionId}/sections/${sectionIndex}/class-teacher`, {
        teacherId: selectedTeacherId,
        assignedDate: new Date(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classSections'] });
      closeAssignModal();
      notifications.show({ title: 'Success', message: 'Class teacher assigned', color: 'green' });
    },
  });

  const handleAssign = () => {
    if (!selectedTeacherId) {
      notifications.show({ title: 'Error', message: 'Please select a teacher', color: 'red' });
      return;
    }
    assignTeacherMutation.mutate();
  };

  const getClassTeacher = (cs: ClassSection, sectionIndex: number) => {
    const section = cs.sections[sectionIndex];
    if (!section) return null;
    const teacher = teachers?.find(t => t._id === section.currentClassTeacherId);
    return teacher;
  };

  if (isLoading) return <Loader />;

  const availableClassSections = classSections?.filter(cs => cs.sections && cs.sections.length > 0) || [];

  return (
    <Stack>
      <Card withBorder shadow="sm" p="md" radius="md">
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
      </Card>

      {!selectedSeasonId && (
        <Alert color="blue" title="Select Season">Please select an academic season to manage class teachers.</Alert>
      )}

      {selectedSeasonId && availableClassSections.length > 0 && (
        <Card withBorder shadow="sm" p="md" radius="md">
          <Table striped highlightOnHover>
            <thead>
              <tr>
                <th>Class</th>
                <th>Section</th>
                <th>Current Class Teacher</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {availableClassSections.map((cs) => {
                const className = (cs.classId as any)?.displayName || 'Unknown';
                return cs.sections.map((section, sectionIdx) => {
                  const classTeacher = getClassTeacher(cs, sectionIdx);
                  return (
                    <tr key={`${cs._id}-${section.name}`}>
                      <td>{className}</td>
                      <td>{section.name}</td>
                      <td>
                        {classTeacher ? (
                          <Badge color="green" size="lg">{classTeacher.name}</Badge>
                        ) : (
                          <Badge color="yellow">Not Assigned</Badge>
                        )}
                      </td>
                      <td>
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => {
                            setSelectedClassSectionId(cs._id);
                            setSelectedSectionIndex(sectionIdx);
                            setSelectedTeacherId(classTeacher?._id || '');
                            openAssignModal();
                          }}
                        >
                          {classTeacher ? 'Change' : 'Assign'}
                        </Button>
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </Table>
        </Card>
      )}

      <Modal opened={assignModalOpen} onClose={closeAssignModal} title="Assign Class Teacher" size="md">
        <Select
          label="Select Teacher"
          placeholder="Choose teacher"
          data={teachers?.map(t => ({ value: t._id, label: `${t.name} (${t.teacherId})` })) || []}
          value={selectedTeacherId}
          onChange={setSelectedTeacherId}
          searchable
          required
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeAssignModal}>Cancel</Button>
          <Button onClick={handleAssign} loading={assignTeacherMutation.isPending}>Assign</Button>
        </Group>
      </Modal>
    </Stack>
  );
}