import { useState } from 'react';
import { Card, Title, Table, Button, Group, Alert, ActionIcon, Modal, TextInput, Badge } from '@mantine/core';
import { IconTrash, IconEdit, IconPencil, IconUserPlus } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { SectionRoutineEditor } from './SectionRoutineEditor';

interface SectionCardProps {
  classItem: any;
  seasonId: string;
  sections: any[];
  onSectionChanged: () => void;
}

export function SectionCard({ classItem, seasonId, sections, onSectionChanged }: SectionCardProps) {
  const [editingSection, setEditingSection] = useState<any | null>(null);
  const [editingSectionName, setEditingSectionName] = useState<{ id: string; name: string } | null>(null);
  const [newSectionName, setNewSectionName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const schoolId = user.schoolId;

  const createSectionMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post('/sections', {
        classId: classItem._id,
        seasonId: seasonId,
        schoolId: schoolId,
        name: name,
      });
      return res.data;
    },
    onSuccess: () => {
      onSectionChanged();
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      await api.delete(`/sections/${sectionId}`, {
        headers: { 'X-School-Id': schoolId }
      });
    },
    onSuccess: () => {
      onSectionChanged();
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await api.put(`/sections/${id}`, { name });
    },
    onSuccess: () => {
      onSectionChanged();
      setEditingSectionName(null);
      setNewSectionName('');
    },
  });

  const handleDeleteSection = (section: any) => {
    if (confirm(`Delete section "${section.name}"? This will also delete its routine.`)) {
      deleteSectionMutation.mutate(section._id);
    }
  };

  const handleEditSectionName = (section: any) => {
    setEditingSectionName({ id: section._id, name: section.name });
    setNewSectionName(section.name);
  };

  const handleUpdateSectionName = () => {
    if (editingSectionName && newSectionName.trim() && newSectionName !== editingSectionName.name) {
      updateSectionMutation.mutate({ id: editingSectionName.id, name: newSectionName.trim() });
    } else {
      setEditingSectionName(null);
    }
  };

  const handleAddSection = () => {
    const name = prompt('Enter section name (e.g., A, B, C):');
    if (name && name.trim()) {
      createSectionMutation.mutate(name.trim());
    }
  };

  return (
    <Card withBorder shadow="sm" p="md">
      <Title order={4}>{classItem.displayName}</Title>
      <Badge color="blue" variant="light" mt="xs" mb="sm">Periods: {classItem.periodCount}</Badge>
      
      <Button size="xs" variant="light" leftSection={<IconUserPlus size={14} />} onClick={handleAddSection} mb="md" fullWidth>
        Add Section
      </Button>
      
      {sections.length === 0 && <Alert color="yellow" mt="sm">No sections added yet.</Alert>}
      
      {sections.length > 0 && (
        <Table mt="sm">
          <thead><tr><th>Section</th><th>Actions</th></tr></thead>
          <tbody>
            {sections.map((sec) => (
              <tr key={sec._id}>
                <td style={{ fontWeight: 500 }}>{sec.name}</td>
                <td>
                  <Group gap="xs">
                    <Button size="xs" variant="light" onClick={() => setEditingSection(sec)}>
                      <IconEdit size={14} /> Edit Routine
                    </Button>
                    <ActionIcon size="sm" color="blue" variant="subtle" onClick={() => handleEditSectionName(sec)}>
                      <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon size="sm" color="red" variant="subtle" onClick={() => handleDeleteSection(sec)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal opened={!!editingSectionName} onClose={() => setEditingSectionName(null)} title="Edit Section Name">
        <TextInput label="New Section Name" value={newSectionName} onChange={(e) => setNewSectionName(e.currentTarget.value)} required />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setEditingSectionName(null)}>Cancel</Button>
          <Button onClick={handleUpdateSectionName}>Save</Button>
        </Group>
      </Modal>

      {editingSection && (
        <SectionRoutineEditor
          opened={!!editingSection}
          onClose={() => setEditingSection(null)}
          sectionId={editingSection._id}
          periodCount={classItem.periodCount}
          sectionName={editingSection.name}
          onRoutineUpdated={() => {
            onSectionChanged();
            setEditingSection(null);
          }}
        />
      )}
    </Card>
  );
}