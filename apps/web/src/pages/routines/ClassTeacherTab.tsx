import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, Card, Text, Title, Center, Select, Button, Group, Table, Badge, Loader, Alert, Modal, Tooltip, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconUserShield, IconUserPlus, IconEdit, IconTrash, IconRefresh, IconSchool, IconCalendar } from '@tabler/icons-react';
import { api } from '../../lib/api';
import { ClassSection, AcademicSeason, Teacher } from '../../lib/types';
import { notifications } from '@mantine/notifications';

export function ClassTeacherTab() {
  const queryClient = useQueryClient();
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [assignModalOpen, { open: openAssignModal, close: closeAssignModal }] = useDisclosure(false);

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

  const { data: sections, isLoading, refetch } = useQuery({
    queryKey: ['sections', selectedSeasonId, schoolId],
    queryFn: () => api.get('/sections', { 
      params: { seasonId: selectedSeasonId },
      headers: { 'X-School-Id': schoolId } 
    }).then(res => res.data),
    enabled: !!selectedSeasonId && !!schoolId,
  });

  const assignTeacherMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/sections/${selectedSectionId}/assign-class-teacher`, {
        teacherId: selectedTeacherId,
        subjectId: null, // This should be set based on subject selection
        assignedDate: new Date().toISOString(),
      }, { headers: { 'X-School-Id': schoolId } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      closeAssignModal();
      notifications.show({ title: 'Success', message: 'Class teacher assigned', color: 'green' });
    },
    onError: (err: any) => {
      notifications.show({ title: 'Error', message: err.response?.data?.message || 'Failed to assign', color: 'red' });
    },
  });

  const handleAssign = () => {
    if (!selectedTeacherId) {
      notifications.show({ title: 'Error', message: 'Please select a teacher', color: 'red' });
      return;
    }
    assignTeacherMutation.mutate();
  };

  const getClassTeacher = (section: any) => {
    if (!section?.currentClassTeacherId) return null;
    let teacherId = section.currentClassTeacherId;
    if (typeof teacherId === 'object') teacherId = teacherId._id;
    return teachers?.find(t => t._id === teacherId);
  };

  if (isLoading) return <Loader />;

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
          leftSection={<IconCalendar size={16} />}
        />
      </Card>

      {!selectedSeasonId && (
        <Alert color="blue" title="Select Season">Please select an academic season to manage class teachers.</Alert>
      )}

      {selectedSeasonId && sections && sections.length > 0 && (
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
              {sections.map((section) => {
                const className = (section.classId as any)?.displayName || 'Unknown';
                const classTeacher = getClassTeacher(section);
                return (
                  <tr key={section._id}>
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
                          setSelectedSectionId(section._id);
                          setSelectedTeacherId(classTeacher?._id || '');
                          openAssignModal();
                        }}
                      >
                        {classTeacher ? 'Change' : 'Assign'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}

      {selectedSeasonId && sections?.length === 0 && !isLoading && (
        <Alert color="yellow" title="No Sections">No sections found for the selected season.</Alert>
      )}

      <Modal opened={assignModalOpen} onClose={closeAssignModal} title="Assign Class Teacher" size="md" centered>
        <Select
          label="Select Teacher"
          placeholder="Choose teacher"
          data={teachers?.map(t => ({ value: t._id, label: `${t.name}` })) || []}
          value={selectedTeacherId}
          onChange={setSelectedTeacherId}
          searchable
          required
          leftSection={<IconUserShield size={16} />}
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeAssignModal}>Cancel</Button>
          <Button onClick={handleAssign} loading={assignTeacherMutation.isPending} color="blue">
            Assign Class Teacher
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}