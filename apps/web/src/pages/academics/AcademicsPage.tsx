import { useState } from 'react';
import { Tabs, Stack, Title } from '@mantine/core';
import { GlobalClassesTab } from './GlobalClassesTab';
import { AcademicSeasonsTab } from './AcademicSeasonsTab';
import { SeasonSectionsTab } from './SeasonSectionsTab';

export function AcademicsPage() {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');

  return (
    <Stack p="md">
      <Title order={1}>Academic Management</Title>
      <Tabs defaultValue="classes">
        <Tabs.List>
          <Tabs.Tab value="classes">Global Classes</Tabs.Tab>
          <Tabs.Tab value="seasons">Academic Seasons</Tabs.Tab>
          <Tabs.Tab value="sections">Sections per Season</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="classes" pt="md"><GlobalClassesTab /></Tabs.Panel>
        <Tabs.Panel value="seasons" pt="md"><AcademicSeasonsTab /></Tabs.Panel>
        <Tabs.Panel value="sections" pt="md">
          <SeasonSectionsTab selectedSeasonId={selectedSeasonId} onSeasonChange={setSelectedSeasonId} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}