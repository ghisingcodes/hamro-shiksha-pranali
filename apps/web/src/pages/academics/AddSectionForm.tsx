import { useState } from 'react';
import { Button, TextInput, Group, Stack, Box, ActionIcon } from '@mantine/core';
import { IconTrash, IconPlus } from '@tabler/icons-react';

interface AddSectionFormProps {
  existingSections: string[];
  isAddingSingle: boolean;
  isAddingBulk: boolean;
  onStartSingle: () => void;
  onCancelSingle: () => void;
  onStartBulk: () => void;
  onCancelBulk: () => void;
  onAddSection: (name: string) => void;
  onAddBulkSections: (names: string[]) => void;
}

export function AddSectionForm({
  existingSections,
  isAddingSingle,
  isAddingBulk,
  onStartSingle,
  onCancelSingle,
  onStartBulk,
  onCancelBulk,
  onAddSection,
  onAddBulkSections,
}: AddSectionFormProps) {
  const [singleName, setSingleName] = useState('');
  const [bulkNames, setBulkNames] = useState<string[]>(['']);

  const handleAddSingle = () => {
    const name = singleName.trim();
    if (!name) return;
    if (existingSections.includes(name)) {
      alert(`Section "${name}" already exists.`);
      return;
    }
    onAddSection(name);
    setSingleName('');
  };

  const handleAddBulk = () => {
    const valid = bulkNames.map(n => n.trim()).filter(n => n);
    if (valid.length === 0) return;
    const unique = [...new Set(valid)];
    if (unique.length !== valid.length) {
      alert('Duplicate section names in form.');
      return;
    }
    const duplicates = unique.filter(n => existingSections.includes(n));
    if (duplicates.length) {
      alert(`Sections already exist: ${duplicates.join(', ')}`);
      return;
    }
    onAddBulkSections(unique);
    setBulkNames(['']);
  };

  const addBulkField = () => setBulkNames([...bulkNames, '']);
  const removeBulkField = (idx: number) => setBulkNames(bulkNames.filter((_, i) => i !== idx));
  const updateBulkField = (idx: number, val: string) => {
    const updated = [...bulkNames];
    updated[idx] = val;
    setBulkNames(updated);
  };

  if (!isAddingSingle && !isAddingBulk) {
    return (
      <>
        <Button size="xs" variant="light" onClick={onStartSingle} fullWidth mt="sm">+ Add Single Section</Button>
        <Button size="xs" variant="outline" onClick={onStartBulk} fullWidth mt="xs">+ Bulk Add Sections</Button>
      </>
    );
  }

  if (isAddingSingle) {
    return (
      <Box mt="sm" p="xs" style={{ border: '1px solid #e9ecef', borderRadius: 8 }}>
        <TextInput placeholder="Section name (e.g., A)" value={singleName} onChange={e => setSingleName(e.currentTarget.value)} size="xs" />
        <Group justify="flex-end" mt="xs">
          <Button size="xs" variant="subtle" onClick={onCancelSingle}>Cancel</Button>
          <Button size="xs" onClick={handleAddSingle}>Add</Button>
        </Group>
      </Box>
    );
  }

  return (
    <Box mt="sm" p="xs" style={{ border: '1px solid #e9ecef', borderRadius: 8 }}>
      <Stack gap="xs">
        {bulkNames.map((name, idx) => (
          <Group key={idx} align="flex-end">
            <TextInput placeholder="Section name" value={name} onChange={e => updateBulkField(idx, e.currentTarget.value)} size="xs" style={{ flex: 1 }} />
            <ActionIcon size="sm" color="red" onClick={() => removeBulkField(idx)}><IconTrash size={14} /></ActionIcon>
          </Group>
        ))}
        <Button size="xs" variant="light" onClick={addBulkField} leftSection={<IconPlus size={14} />}>Add Another</Button>
        <Group justify="flex-end" mt="xs">
          <Button size="xs" variant="subtle" onClick={onCancelBulk}>Cancel</Button>
          <Button size="xs" onClick={handleAddBulk}>Add {bulkNames.filter(n => n.trim()).length} Sections</Button>
        </Group>
      </Stack>
    </Box>
  );
}