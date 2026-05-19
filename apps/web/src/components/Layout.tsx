import { ReactNode } from 'react';
import { AppShell, NavLink, Burger, Group, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, useLocation } from 'react-router-dom';
import { 
  IconHome, 
  IconSchool, 
  IconCalendar, 
  IconUsers, 
  IconUser, 
  IconClock 
} from '@tabler/icons-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: IconHome },
  { to: '/academics', label: 'Academics', icon: IconSchool },
  { to: '/class-routine', label: 'Class Routine', icon: IconCalendar },
  { to: '/students', label: 'Students', icon: IconUsers },
  { to: '/teachers', label: 'Teachers', icon: IconUser },
  { to: '/teacher-schedule', label: 'Teacher Schedule', icon: IconClock },
];

export function Layout({ children }: { children: ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const location = useLocation();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 280, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Title order={3}>Hamro Shiksha Pranali</Title>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            component={Link}
            to={item.to}
            label={item.label}
            leftSection={<item.icon size={20} />}
            active={location.pathname === item.to}
            variant="subtle"
          />
        ))}
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}