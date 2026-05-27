// apps/web/src/pages/academics/ClassSectionCard.tsx
import { useState, useEffect } from 'react';
import { Card, Title, Table, Button, Group, Alert, ActionIcon, Modal, TextInput, Stack, Badge, Loader } from '@mantine/core';
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSections(initialSections);
  }, [initialSections]);

  // Fetch or create ClassSection ID - SIMPLIFIED
  useEffect(() => {
    const fetchClassSection = async () => {
      try {
        setIsLoading(true);
        // Try to find existing
        const res = await api.get(`/class-sections?seasonId=${seasonId}&classId=${classItem._id}`);
        const existing = res.data;
        
        if (existing && existing.length > 0) {
          setClassSectionId(existing[0]._id);
        } else {
          // Don't auto-create - let user add section first
          setClassSectionId(null);
        }
      } catch (error) {
        console.error('Failed to fetch class section', error);
        setClassSectionId(null);
      } finally {
        setIsLoading(false);
      }
    };
    if (seasonId && classItem._id) {
      fetchClassSection();
    }
  }, [seasonId, classItem._id]);

  // Create ClassSection when adding first section
  const createClassSection = async () => {
    const res = await api.post('/class-sections', {
      classId: classItem._id,
      seasonId,
      sections: [],
    });
    return res.data._id;
  };

  const addSectionMutation = useMutation({
    mutationFn: async (name: string) => {
      let csId = classSectionId;
      if (!csId) {
        csId = await createClassSection();
        setClassSectionId(csId);
      }
      await api.post(`/class-sections/${csId}/sections`, { name });
      onSectionChanged();
    },
    onSuccess: () => {
      setAddingSingle(false);
      setAddingBulk(false);
    },
  });

  const addBulkSectionsMutation = useMutation({
    mutationFn: async (names: string[]) => {
      let csId = classSectionId;
      if (!csId) {
        csId = await createClassSection();
        setClassSectionId(csId);
      }
      for (const name of names) {
        await api.post(`/class-sections/${csId}/sections`, { name });
      }
      onSectionChanged();
    },
    onSuccess: () => {
      setAddingSingle(false);
      setAddingBulk(false);
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionName: string) => {
      if (!classSectionId) throw new Error('ClassSection not ready');
      await api.delete(`/class-sections/${classSectionId}/sections/${encodeURIComponent(sectionName)}`);
      onSectionChanged();
    },
  });

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

  if (isLoading) {
    return (
      <Card withBorder shadow="sm" p="md">
        <Title order={4}>{classItem.displayName}</Title>
        <Loader size="sm" mt="md" />
      </Card>
    );
  }

  return (
    <Card withBorder shadow="sm" p="md">
      <Title order={4}>{classItem.displayName}</Title>
      <Badge color="blue" variant="light" mt="xs" mb="sm">Periods: {classItem.periodCount}</Badge>
      
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
                <td style={{ fontWeight: 500 }}>{sec.name}</td>
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

      <Modal opened={!!editingSectionName} onClose={() => setEditingSectionName(null)} title="Edit Section Name">
        <TextInput label="New Section Name" value={newSectionName} onChange={(e) => setNewSectionName(e.currentTarget.value)} required />
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