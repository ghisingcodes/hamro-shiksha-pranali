import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, Stack, Title, ThemeIcon, Group, Text, Badge, Container } from '@mantine/core';
import { 
  IconSchool, 
  IconCalendar, 
  IconBooks, 
  IconBook, 
  IconLayoutGrid,
  IconBuilding
} from '@tabler/icons-react';
import { ClassesTab } from './tabs/ClassesTab';
import { SeasonsTab } from './tabs/SeasonsTab';
import { SectionsTab } from './tabs/SectionsTab';
import { SubjectsTab } from './tabs/SubjectsTab';
import { RoutineTab } from './tabs/RoutineTab';

const tabItems = [
  { value: 'classes', label: 'Classes', icon: IconBuilding, color: 'blue', needsSeason: false },
  { value: 'seasons', label: 'Seasons', icon: IconCalendar, color: 'teal', needsSeason: false },
  { value: 'sections', label: 'Sections', icon: IconLayoutGrid, color: 'cyan', needsSeason: true },
  { value: 'subjects', label: 'Subjects', icon: IconBooks, color: 'violet', needsSeason: true },
  { value: 'routine', label: 'Class Routine', icon: IconBook, color: 'orange', needsSeason: true },
];

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

const tabButtonVariants = {
  inactive: { scale: 1, opacity: 0.7 },
  active: { scale: 1, opacity: 1, transition: { duration: 0.2 } },
  hover: { scale: 1.02, y: -2, transition: { duration: 0.1 } },
};

export function AcademicsPage() {
  const [activeTab, setActiveTab] = useState<string | null>('classes');
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');

  return (
    <Container size="xl" p="md">
      <Stack gap="lg">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Group justify="space-between" align="center">
            <Group>
              <ThemeIcon size="lg" color="blue" variant="light" radius="md">
                <IconSchool size={20} />
              </ThemeIcon>
              <div>
                <Title order={1}>Academics Management</Title>
                <Text size="sm" c="dimmed">Manage classes, seasons, sections, subjects and routines</Text>
              </div>
            </Group>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <Badge size="lg" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                Academic Year {new Date().getFullYear()}
              </Badge>
            </motion.div>
          </Group>
        </motion.div>

        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          variant="pills"
          radius="xl"
          color="blue"
        >
          <Tabs.List grow>
            {tabItems.map((item) => (
              <motion.div
                key={item.value}
                variants={tabButtonVariants}
                initial="inactive"
                animate={activeTab === item.value ? 'active' : 'inactive'}
                whileHover="hover"
              >
                <Tabs.Tab
                  value={item.value}
                  leftSection={<item.icon size={18} />}
                >
                  {item.label}
                </Tabs.Tab>
              </motion.div>
            ))}
          </Tabs.List>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Tabs.Panel value="classes" pt="md">
                <ClassesTab />
              </Tabs.Panel>

              <Tabs.Panel value="seasons" pt="md">
                <SeasonsTab onSeasonChange={setSelectedSeasonId} />
              </Tabs.Panel>

              <Tabs.Panel value="sections" pt="md">
                <SectionsTab 
                  selectedSeasonId={selectedSeasonId} 
                  onSeasonChange={setSelectedSeasonId} 
                />
              </Tabs.Panel>

              <Tabs.Panel value="subjects" pt="md">
                <SubjectsTab 
                  selectedSeasonId={selectedSeasonId} 
                  onSeasonChange={setSelectedSeasonId} 
                />
              </Tabs.Panel>

              <Tabs.Panel value="routine" pt="md">
                <RoutineTab 
                  selectedSeasonId={selectedSeasonId} 
                  onSeasonChange={setSelectedSeasonId} 
                />
              </Tabs.Panel>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </Stack>
    </Container>
  );
}