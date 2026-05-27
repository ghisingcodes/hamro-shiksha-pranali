import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, Grid, Loader, Alert, Text, Stack, Group, Button } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { api } from '../../lib/api';
import { Class, AcademicSeason, ClassSection } from '../../lib/types';
import { ClassSectionCard } from './ClassSectionCard';

interface SeasonSectionsTabProps {
  selectedSeasonId: string;
  onSeasonChange: (seasonId: string) => void;
}

export function SeasonSectionsTab({ selectedSeasonId, onSeasonChange }: SeasonSectionsTabProps) {
  const { data: classes, isLoading: classesLoading, error: classesError, refetch: refetchClasses } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then(res => res.data),
  });

  const { data: seasons, refetch: refetchSeasons } = useQuery<AcademicSeason[]>({
    queryKey: ['seasons'],
    queryFn: () => api.get('/academic-seasons').then(res => res.data),
  });

  // Fetch all class sections for the selected season
  const { data: classSections, refetch: refetchClassSections, isLoading: sectionsLoading } = useQuery<ClassSection[]>({
    queryKey: ['classSections', selectedSeasonId],
    queryFn: () => api.get(`/class-sections?seasonId=${selectedSeasonId}`).then(res => res.data),
    enabled: !!selectedSeasonId,
  });

  // Helper function to get sections for a specific class
  const getSectionsForClass = (classId: string) => {
    if (!classSections) return [];
    const cs = classSections.find(c => {
      const csClassId = typeof c.classId === 'string' ? c.classId : (c.classId as any)?._id;
      return csClassId === classId;
    });
    return cs?.sections || [];
  };

  const handleRefresh = () => {
    refetchClasses();
    refetchSeasons();
    refetchClassSections();
  };

  if (classesLoading || (selectedSeasonId && sectionsLoading)) return <Loader />;
  if (classesError) return <Alert color="red">Error loading classes: {classesError.message}</Alert>;

  const activeSeason = seasons?.find(s => s.isActive);

  return (
    <Stack>
      <Group align="flex-end" justify="space-between">
        <Select
          label="Academic Season"
          placeholder="Choose season"
          data={seasons?.map(s => ({ value: s._id, label: `${s.name}${s.isActive ? ' (Active)' : ''}` })) || []}
          value={selectedSeasonId}
          onChange={(val) => onSeasonChange(val || '')}
          clearable
          style={{ width: 300 }}
        />
        <Button variant="light" onClick={handleRefresh} leftSection={<IconRefresh size={16} />}>Refresh</Button>
      </Group>

      {!selectedSeasonId && (
        <Alert color="blue" mt="md">
          Please select an academic season to view class sections.
          {activeSeason && ` Currently active season is: ${activeSeason.name}`}
        </Alert>
      )}

      {selectedSeasonId && classSections && classSections.length === 0 && (
        <Alert color="yellow" mt="md">
          No class sections found for this season. Click "Add Section" on a class card to create one.
        </Alert>
      )}

      {selectedSeasonId && (
        <Grid mt="md">
          {classes?.map(cls => {
            const sectionsForClass = getSectionsForClass(cls._id);
            return (
              <Grid.Col key={cls._id} span={{ base: 12, md: 6, lg: 4 }}>
                <ClassSectionCard
                  classItem={cls}
                  seasonId={selectedSeasonId}
                  initialSections={sectionsForClass}
                  onSectionChanged={() => refetchClassSections()}
                />
              </Grid.Col>
            );
          })}
        </Grid>
      )}
    </Stack>
  );
}