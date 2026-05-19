import { useState, useEffect } from 'react';
import { Card, Title, Table, Button, Group, Alert, ActionIcon, Modal, TextInput } from '@mantine/core';
import { IconTrash, IconEdit, IconPencil } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { AddSectionForm } from './AddSectionForm';
import { SectionRoutineEditor } from './SectionRoutineEditor';

interface ClassSectionCardProps {
  classItem: any;
  seasonId: string;
  initialSections: any[];
  onSectionChanged: () => void;
}

export function ClassSectionCard({ classItem, seasonId, initialSections, onSectionChanged }: ClassSectionCardProps) {
  const [sections, setSections] = useState(initialSections);
  const [addingSingle, setAddingSingle] = useState(false);
  const [addingBulk, setAddingBulk] = useState(false);
  const [editingSection, setEditingSection] = useState<{ index: number; routine: any[][] } | null>(null);
  const [editingSectionName, setEditingSectionName] = useState<{ index: number; name: string } | null>(null);
  const [newSectionName, setNewSectionName] = useState('');
  const [classSectionId, setClassSectionId] = useState<string | null>(null);

  // Sync sections when initialSections changes
  useEffect(() => {
    setSections(initialSections);
  }, [initialSections]);

  // Fetch or create ClassSection ID for this class+season
  useEffect(() => {
    const fetchOrCreate = async () => {
      try {
        // First try to find existing
        const res = await api.get(`/class-sections?seasonId=${seasonId}&classId=${classItem._id}`);
        const existing = res.data;
        if (existing && existing.length > 0) {
          setClassSectionId(existing[0]._id);
        } else {
          // Create new
          const createRes = await api.post('/class-sections', {
            classId: classItem._id,
            seasonId,
            sections: [],
          });
          setClassSectionId(createRes.data._id);
        }
      } catch (error) {
        console.error('Failed to get/create class section', error);
      }
    };
    if (seasonId && classItem._id) {
      fetchOrCreate();
    }
  }, [seasonId, classItem._id]);

  // Add single section
  const addSectionMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!classSectionId) throw new Error('ClassSection not ready');
      await api.post(`/class-sections/${classSectionId}/sections`, { name });
      onSectionChanged();
    },
    onSuccess: () => {
      setAddingSingle(false);
      setAddingBulk(false);
    },
  });

  // Bulk add sections
  const addBulkSectionsMutation = useMutation({
    mutationFn: async (names: string[]) => {
      if (!classSectionId) throw new Error('ClassSection not ready');
      for (const name of names) {
        await api.post(`/class-sections/${classSectionId}/sections`, { name });
      }
      onSectionChanged();
    },
    onSuccess: () => {
      setAddingSingle(false);
      setAddingBulk(false);
    },
  });

  // Delete section
  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionName: string) => {
      if (!classSectionId) throw new Error('ClassSection not ready');
      await api.delete(`/class-sections/${classSectionId}/sections/${encodeURIComponent(sectionName)}`);
      onSectionChanged();
    },
  });

  // Update section name
  const updateSectionMutation = useMutation({
    mutationFn: async ({ oldName, newName }: { oldName: string; newName: string }) => {
      if (!classSectionId) throw new Error('ClassSection not ready');
      await api.put(`/class-sections/${classSectionId}/sections/${encodeURIComponent(oldName)}`, { name: newName });
      onSectionChanged();
    },
    onSuccess: () => {
      setEditingSectionName(null);
      setNewSectionName('');
    },
  });

  const handleDeleteSection = (sectionName: string) => {
    if (confirm(`Delete section "${sectionName}"? This will also delete its routine.`)) {
      deleteSectionMutation.mutate(sectionName);
    }
  };

  const handleEditSectionName = (index: number, oldName: string) => {
    setEditingSectionName({ index, name: oldName });
    setNewSectionName(oldName);
  };

  const handleUpdateSectionName = () => {
    if (editingSectionName && newSectionName.trim() && newSectionName !== editingSectionName.name) {
      updateSectionMutation.mutate({ oldName: editingSectionName.name, newName: newSectionName.trim() });
    } else {
      setEditingSectionName(null);
    }
  };

  return (
    <Card withBorder shadow="sm" p="md">
      <Title order={4}>{classItem.displayName}</Title>
      {sections.length === 0 && <Alert color="yellow" mt="sm">No sections added yet.</Alert>}
      {sections.length > 0 && (
        <Table mt="sm">
          <thead>
            <tr>
              <th>Section</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((sec, idx) => (
              <tr key={sec.name}>
                <td>{sec.name}</td>
                <td>
                  <Group gap="xs">
                    <Button size="xs" variant="light" onClick={() => setEditingSection({ index: idx, routine: sec.routine })}>
                      <IconEdit size={14} /> Edit Routine
                    </Button>
                    <ActionIcon size="sm" color="blue" variant="subtle" onClick={() => handleEditSectionName(idx, sec.name)}>
                      <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon size="sm" color="red" variant="subtle" onClick={() => handleDeleteSection(sec.name)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <AddSectionForm
        existingSections={sections.map(s => s.name)}
        isAddingSingle={addingSingle}
        isAddingBulk={addingBulk}
        onStartSingle={() => setAddingSingle(true)}
        onCancelSingle={() => setAddingSingle(false)}
        onStartBulk={() => setAddingBulk(true)}
        onCancelBulk={() => setAddingBulk(false)}
        onAddSection={(name) => addSectionMutation.mutate(name)}
        onAddBulkSections={(names) => addBulkSectionsMutation.mutate(names)}
      />

      {/* Edit Section Name Modal */}
      <Modal
        opened={!!editingSectionName}
        onClose={() => setEditingSectionName(null)}
        title="Edit Section Name"
      >
        <TextInput
          label="New Section Name"
          value={newSectionName}
          onChange={(e) => setNewSectionName(e.currentTarget.value)}
          required
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setEditingSectionName(null)}>Cancel</Button>
          <Button onClick={handleUpdateSectionName}>Save</Button>
        </Group>
      </Modal>

      {editingSection && classSectionId && (
        <SectionRoutineEditor
          opened={!!editingSection}
          onClose={() => setEditingSection(null)}
          classSectionId={classSectionId}
          sectionIndex={editingSection.index}
          periodCount={classItem.periodCount}
          initialRoutine={editingSection.routine}
          onRoutineUpdated={() => {
            onSectionChanged();
            setEditingSection(null);
          }}
        />
      )}
    </Card>
  );
}