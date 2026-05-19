import { useQuery } from '@tanstack/react-query';
import { Select, Grid, Loader, Alert } from '@mantine/core';
import { api } from '../../lib/api';
import { Class, AcademicSeason, ClassSection } from '../../lib/types';
import { ClassSectionCard } from './ClassSectionCard';

interface SeasonSectionsTabProps {
  selectedSeasonId: string;
  onSeasonChange: (seasonId: string) => void;
}

export function SeasonSectionsTab({ selectedSeasonId, onSeasonChange }: SeasonSectionsTabProps) {
  const { data: classes, isLoading: classesLoading, error: classesError } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then(res => res.data),
  });

  const { data: seasons } = useQuery<AcademicSeason[]>({
    queryKey: ['seasons'],
    queryFn: () => api.get('/academic-seasons').then(res => res.data),
  });

  // Fetch class sections for each class individually using both filters
  // We'll fetch all class sections for the season and then filter client-side
  const { data: allClassSections, refetch, isLoading: sectionsLoading } = useQuery<ClassSection[]>({
    queryKey: ['classSections', selectedSeasonId],
    queryFn: () => api.get(`/class-sections?seasonId=${selectedSeasonId}`).then(res => res.data),
    enabled: !!selectedSeasonId,
  });

  // Helper to get sections for a specific class
  const getSectionsForClass = (classId: string) => {
    if (!allClassSections) return [];
    const cs = allClassSections.find(c => {
      const csClassId = typeof c.classId === 'string' ? c.classId : (c.classId as any)?._id;
      return csClassId === classId;
    });
    return cs?.sections || [];
  };

  if (classesLoading || (selectedSeasonId && sectionsLoading)) return <Loader />;
  if (classesError) return <Alert color="red">Error: {classesError.message}</Alert>;

  return (
    <>
      <Select
        label="Select Academic Season"
        placeholder="Choose season"
        data={seasons?.map(s => ({ value: s._id, label: s.name })) || []}
        value={selectedSeasonId}
        onChange={(val) => onSeasonChange(val || '')}
        mb="md"
      />
      {selectedSeasonId && (
        <Grid>
          {classes?.map(cls => (
            <Grid.Col key={cls._id} span={{ base: 12, md: 6, lg: 4 }}>
              <ClassSectionCard
                classItem={cls}
                seasonId={selectedSeasonId}
                initialSections={getSectionsForClass(cls._id)}
                onSectionChanged={() => refetch()}
              />
            </Grid.Col>
          ))}
        </Grid>
      )}
    </>
  );
}