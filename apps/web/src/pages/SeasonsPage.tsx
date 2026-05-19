import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Button, Card, Grid, Text, Group, Modal, TextInput, Switch, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { AcademicSeason } from '../lib/types';

export function SeasonsPage() {
  const { data: seasons, refetch } = useQuery<AcademicSeason[]>({
    queryKey: ['seasons'],
    queryFn: () => api.get('/academic-seasons').then(res => res.data),
  });
  const queryClient = useQueryClient();
  const [opened, setOpened] = useState(false);

  const form = useForm({
    initialValues: { name: '', startDate: '', endDate: '', isActive: false },
    validate: {
      name: (v) => (!v ? 'Required' : null),
      startDate: (v) => (!v ? 'Required' : null),
      endDate: (v) => (!v ? 'Required' : null),
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/academic-seasons', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      setOpened(false);
      form.reset();
      notifications.show({ title: 'Success', message: 'Season created', color: 'green' });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: ({ id, copyClasses }: { id: string; copyClasses: boolean }) =>
      api.post(`/academic-seasons/duplicate/${id}`, { copyClasses }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      notifications.show({ title: 'Success', message: 'Season duplicated', color: 'green' });
    },
  });

  return (
    <Stack>
      <Group justify="space-between">
        <h1>Academic Seasons</h1>
        <Button onClick={() => setOpened(true)}>New Season</Button>
      </Group>
      <Grid>
        {seasons?.map(season => (
          <Grid.Col key={season._id} span={{ base: 12, sm: 6, md: 4 }}>
            <Card withBorder shadow="sm" padding="lg">
              <Text fw={700} size="lg">{season.name}</Text>
              <Text size="sm">Start: {new Date(season.startDate).toLocaleDateString()}</Text>
              <Text size="sm">End: {new Date(season.endDate).toLocaleDateString()}</Text>
              <Text size="sm" c={season.isActive ? 'green' : 'dimmed'}>{season.isActive ? 'Active' : 'Inactive'}</Text>
              <Group mt="md">
                <Button variant="outline" size="xs" onClick={() => duplicateMutation.mutate({ id: season._id, copyClasses: true })}>
                  Duplicate with classes
                </Button>
              </Group>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      <Modal opened={opened} onClose={() => setOpened(false)} title="Create Academic Season">
        <form onSubmit={form.onSubmit((values) => createMutation.mutate(values))}>
          <Stack>
            <TextInput label="Name" {...form.getInputProps('name')} />
            <TextInput type="date" label="Start Date" {...form.getInputProps('startDate')} />
            <TextInput type="date" label="End Date" {...form.getInputProps('endDate')} />
            <Switch label="Active" {...form.getInputProps('isActive')} />
            <Button type="submit" loading={createMutation.isPending}>Create</Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}