import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppShell, Burger, Group, Title, Text, ThemeIcon, Accordion, NavLink, Divider, ScrollArea, Menu, Avatar, rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconHome, IconSchool, IconCalendar, IconUsers, IconUser, IconClock,
  IconChecklist, IconCalendarMonth, IconUserCheck, IconLayoutDashboard,
  IconBook, IconChartBar, IconUserPlus, IconReceipt, IconSettings,
  IconReportAnalytics, IconLogout, IconShieldLock, IconBriefcase
} from '@tabler/icons-react';

interface NavGroup {
  label: string;
  icon: React.ElementType;
  color: string;
  items: {
    to: string;
    label: string;
    icon: React.ElementType;
    color: string;
    adminOnly?: boolean;
  }[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Dashboard',
    icon: IconLayoutDashboard,
    color: 'blue',
    items: [
      { to: '/', label: 'Overview', icon: IconHome, color: 'blue' },
    ],
  },
  {
    label: 'Academics',
    icon: IconSchool,
    color: 'teal',
    items: [
      { to: '/academics', label: 'Manage Academics', icon: IconSchool, color: 'teal' },
      { to: '/class-routine', label: 'Class Routine', icon: IconCalendar, color: 'green' },
    ],
  },
  {
    label: 'Student Management',
    icon: IconUsers,
    color: 'cyan',
    items: [
      { to: '/students', label: 'All Students', icon: IconUsers, color: 'cyan' },
      { to: '/enrollment', label: 'Student Enrollment', icon: IconUserPlus, color: 'green' },
      { to: '/student-activities', label: 'Student Activity', icon: IconBook, color: 'teal' },
    ],
  },
  {
    label: 'Teacher Management',
    icon: IconUser,
    color: 'grape',
    items: [
      { to: '/teachers', label: 'All Teachers', icon: IconUser, color: 'grape' },
      { to: '/teacher-schedule', label: 'Teacher Schedule', icon: IconClock, color: 'orange' },
    ],
  },
  {
    label: 'Attendance',
    icon: IconChecklist,
    color: 'lime',
    items: [
      { to: '/attendance/daily', label: 'Daily Attendance', icon: IconChecklist, color: 'lime' },
      { to: '/attendance/monthly', label: 'Monthly Report', icon: IconCalendarMonth, color: 'indigo' },
      { to: '/attendance/student', label: 'Student Report', icon: IconUserCheck, color: 'violet' },
    ],
  },
  {
    label: 'Reports',
    icon: IconReportAnalytics,
    color: 'red',
    items: [
      { to: '/reports/academic', label: 'Academic Reports', icon: IconBook, color: 'red' },
      { to: '/reports/attendance', label: 'Attendance Summary', icon: IconChartBar, color: 'yellow' },
      { to: '/reports/fees', label: 'Fee Reports', icon: IconReceipt, color: 'orange' },
    ],
  },
  {
    label: 'Administration',
    icon: IconShieldLock,
    color: 'violet',
    items: [
      { to: '/users', label: 'User Management', icon: IconUsers, color: 'violet', adminOnly: true },
      { to: '/staff', label: 'Staff Management', icon: IconBriefcase, color: 'grape', adminOnly: true },
      { to: '/settings/general', label: 'General Settings', icon: IconSettings, color: 'gray', adminOnly: true },
    ],
  },
];

export function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [opened, { toggle }] = useDisclosure();
  const [activeAccordion, setActiveAccordion] = useState<string | null>(() => {
    for (const group of navGroups) {
      if (group.items.some(item => item.to === location.pathname)) {
        return group.label;
      }
    }
    return null;
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'super_admin' || user.role === 'admin';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Filter nav items based on user role
  const filteredNavGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => !item.adminOnly || isAdmin),
  })).filter(group => group.items.length > 0);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 280, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
      styles={{
        main: { backgroundColor: '#f5f7fa' },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <ThemeIcon size={36} radius="md" color="blue" variant="light">
              <IconSchool size={22} />
            </ThemeIcon>
            <Title order={3} style={{ fontWeight: 600, letterSpacing: '-0.5px' }}>
              Hamro Shiksha Pranali
            </Title>
          </Group>
          <Group visibleFrom="sm">
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <Avatar radius="xl" size="sm" color="blue" style={{ cursor: 'pointer' }}>
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{user.name || 'User'}</Menu.Label>
                <Menu.Label c="dimmed" size="xs">{user.role || 'Role'}</Menu.Label>
                <Divider />
                <Menu.Item leftSection={<IconLogout size={14} />} onClick={handleLogout}>
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" style={{ backgroundColor: '#ffffff', borderRight: '1px solid #e9ecef' }}>
        <ScrollArea style={{ height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1 }}>
              {filteredNavGroups.map((group) => (
                <Accordion
                  key={group.label}
                  variant="filled"
                  value={activeAccordion}
                  onChange={setActiveAccordion}
                  styles={{
                    item: { border: 'none', marginBottom: '4px' },
                    control: { padding: '8px 12px', borderRadius: '8px', '&:hover': { backgroundColor: '#f8f9fa' } },
                  }}
                >
                  <Accordion.Item value={group.label}>
                    <Accordion.Control
                      icon={
                        <ThemeIcon size="sm" color={group.color} variant="light" radius="md">
                          <group.icon size={18} />
                        </ThemeIcon>
                      }
                    >
                      <Text size="sm" fw={500}>{group.label}</Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <div style={{ paddingLeft: '8px' }}>
                        {group.items.map((item) => (
                          <NavLink
                            key={item.to}
                            onClick={() => navigate(item.to)}
                            label={item.label}
                            leftSection={<item.icon size={18} color={item.color} />}
                            active={location.pathname === item.to}
                            variant="light"
                            styles={{
                              root: { borderRadius: '6px', marginBottom: '2px', padding: '6px 12px' },
                              label: { fontSize: '13px', fontWeight: 500 },
                            }}
                          />
                        ))}
                      </div>
                    </Accordion.Panel>
                  </Accordion.Item>
                </Accordion>
              ))}
            </div>

            <div style={{ marginTop: 'auto' }}>
              <Divider my="md" />
              <Group px="xs" py="sm">
                <ThemeIcon size="sm" color="gray" variant="light" radius="xl">
                  <IconUser size={12} />
                </ThemeIcon>
                <Text size="xs" c="dimmed">
                  Logged in as: {user.name || 'Unknown'}
                </Text>
              </Group>
            </div>
          </div>
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}