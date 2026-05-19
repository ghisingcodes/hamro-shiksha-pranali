import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, TextInput, Group, Stack, Title } from '@mantine/core';
import { api } from '../lib/api';
import { useState } from 'react';

export function ClassesPage() {
  const { data: classes } = useQuery({ queryKey: ['classes'], queryFn: () => api.get('/classes').then(res => res.data) });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', displayName: '', grade: 5, periodCount: 7 });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/classes', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['classes'] }); setOpen(false); }
  });

  return (
    <Stack p="md">
      <Group justify="space-between">
        <Title>Global Classes</Title>
        <Button onClick={() => setOpen(true)}>Add Class</Button>
      </Group>
      <Table striped>
        <thead><tr><th>Name</th><th>Display Name</th><th>Grade</th><th>Periods</th></tr></thead>
        <tbody>
          {classes?.map((c: any) => (
            <tr key={c._id}><td>{c.name}</td><td>{c.displayName}</td><td>{c.grade}</td><td>{c.periodCount}</td></tr>
          ))}
        </tbody>
      </Table>
      <Modal opened={open} onClose={() => setOpen(false)} title="New Class">
        <TextInput label="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        <TextInput label="Display Name" value={form.displayName} onChange={e => setForm({...form, displayName: e.target.value})} />
        <TextInput label="Grade (0-12)" type="number" value={form.grade} onChange={e => setForm({...form, grade: parseInt(e.target.value)})} />
        <TextInput label="Period Count" type="number" value={form.periodCount} onChange={e => setForm({...form, periodCount: parseInt(e.target.value)})} />
        <Group justify="flex-end" mt="md"><Button onClick={() => createMutation.mutate(form)}>Save</Button></Group>
      </Modal>
    </Stack>
  );
}