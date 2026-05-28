import { Stack, Title, Tabs } from '@mantine/core';
import { IconSchool, IconUser, IconUserShield } from '@tabler/icons-react';
import { ClassSectionRoutineTab } from './ClassSectionRoutineTab';
import { TeacherRoutineTab } from './TeacherRoutineTab';
import { ClassTeacherTab } from './ClassTeacherTab';

export function TeacherSchedulePage() {
  return (
    <Stack p="md" gap="lg">
      <Title order={1}>📋 Routine Manager</Title>
      <Tabs defaultValue="class-section" variant="outline" radius="md">
        <Tabs.List grow>
          <Tabs.Tab value="class-section" leftSection={<IconSchool size={18} />}>
            Class & Section Routine
          </Tabs.Tab>
          <Tabs.Tab value="teacher" leftSection={<IconUser size={18} />}>
            Teacher Routine
          </Tabs.Tab>
          <Tabs.Tab value="class-teacher" leftSection={<IconUserShield size={18} />}>
            Class Teacher
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="class-section" pt="md">
          <ClassSectionRoutineTab />
        </Tabs.Panel>

        <Tabs.Panel value="teacher" pt="md">
          <TeacherRoutineTab />
        </Tabs.Panel>

        <Tabs.Panel value="class-teacher" pt="md">
          <ClassTeacherTab />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}