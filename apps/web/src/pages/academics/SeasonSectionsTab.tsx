import { useQuery } from '@tanstack/react-query';
import { Select, Grid, Loader, Alert } from '@mantine/core';
import { api } from '../../lib/api';
import { Class, AcademicSeason } from '../../lib/types';
import { SectionCard } from './SectionCard';

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

  const { data: sections, refetch, isLoading: sectionsLoading } = useQuery({
    queryKey: ['sections', selectedSeasonId],
    queryFn: () => api.get(`/sections?seasonId=${selectedSeasonId}`).then(res => res.data),
    enabled: !!selectedSeasonId,
  });

  const getSectionsForClass = (classId: string) => {
    if (!sections) return [];
    return sections.filter((section: any) => {
      const sectionClassId = typeof section.classId === 'string' ? section.classId : section.classId?._id;
      return sectionClassId === classId;
    });
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
              <SectionCard
                classItem={cls}
                seasonId={selectedSeasonId}
                sections={getSectionsForClass(cls._id)}
                onSectionChanged={() => refetch()}
              />
            </Grid.Col>
          ))}
        </Grid>
      )}
    </>
  );
}