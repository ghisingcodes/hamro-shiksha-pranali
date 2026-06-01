import { ReactNode, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { AppShell, Burger, Group, Title, Text, ThemeIcon, Accordion, NavLink, Divider, ScrollArea, Menu, Avatar, rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconHome, IconSchool, IconCalendar, IconUsers, IconUser, IconClock,
  IconChecklist, IconCalendarMonth, IconUserCheck, IconLayoutDashboard,
  IconBook, IconChartBar, IconUserPlus, IconReceipt, IconSettings,
  IconReportAnalytics, IconLogout, IconShieldLock, IconBriefcase,
  IconDashboard
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
    teacherOnly?: boolean;
    studentOnly?: boolean;
    parentOnly?: boolean;
  }[];
}

// Base navigation items (will be prefixed with school slug)
const getNavGroups = (slug: string, userType: string, role: string): NavGroup[] => {
  const isAdmin = role === 'super_admin' || role === 'admin' || userType === 'school_admin';
  const isTeacher = userType === 'teacher' || role === 'teacher';
  const isStudent = userType === 'student';
  const isParent = userType === 'parent';

  return [
    {
      label: 'Dashboard',
      icon: IconLayoutDashboard,
      color: 'blue',
      items: [
        { to: `/${slug}/dashboard`, label: 'Overview', icon: IconDashboard, color: 'blue' },
      ],
    },
    {
      label: 'Academics',
      icon: IconSchool,
      color: 'teal',
      items: [
        { to: `/${slug}/admin/academics`, label: 'Manage Academics', icon: IconSchool, color: 'teal', adminOnly: true },
        { to: `/${slug}/admin/class-routine`, label: 'Class Routine', icon: IconCalendar, color: 'green', adminOnly: true },
      ],
    },
    {
      label: 'Student Management',
      icon: IconUsers,
      color: 'cyan',
      items: [
        { to: `/${slug}/admin/students`, label: 'All Students', icon: IconUsers, color: 'cyan', adminOnly: true },
        { to: `/${slug}/admin/enrollment`, label: 'Student Enrollment', icon: IconUserPlus, color: 'green', adminOnly: true },
        { to: `/${slug}/admin/student-activities`, label: 'Student Activity', icon: IconBook, color: 'teal', adminOnly: true },
      ],
    },
    {
      label: 'Teacher Management',
      icon: IconUser,
      color: 'grape',
      items: [
        { to: `/${slug}/admin/teachers`, label: 'All Teachers', icon: IconUser, color: 'grape', adminOnly: true },
        { to: `/${slug}/admin/teacher-schedule`, label: 'Teacher Schedule', icon: IconClock, color: 'orange', adminOnly: true },
      ],
    },
    {
      label: 'Attendance',
      icon: IconChecklist,
      color: 'lime',
      items: [
        { to: `/${slug}/admin/attendance/daily`, label: 'Daily Attendance', icon: IconChecklist, color: 'lime', adminOnly: true },
        { to: `/${slug}/admin/attendance/monthly`, label: 'Monthly Report', icon: IconCalendarMonth, color: 'indigo', adminOnly: true },
        { to: `/${slug}/admin/attendance/student`, label: 'Student Report', icon: IconUserCheck, color: 'violet', adminOnly: true },
      ],
    },
    {
      label: 'My Classes',
      icon: IconBook,
      color: 'teal',
      items: [
        { to: `/${slug}/teacher/dashboard`, label: 'Teacher Dashboard', icon: IconUser, color: 'grape', teacherOnly: true },
        { to: `/${slug}/teacher/attendance`, label: 'Mark Attendance', icon: IconChecklist, color: 'lime', teacherOnly: true },
        { to: `/${slug}/teacher/activities`, label: 'Daily Activities', icon: IconBook, color: 'teal', teacherOnly: true },
      ],
    },
    {
      label: 'Student Portal',
      icon: IconUsers,
      color: 'cyan',
      items: [
        { to: `/${slug}/student/dashboard`, label: 'My Dashboard', icon: IconDashboard, color: 'blue', studentOnly: true },
        { to: `/${slug}/student/homework`, label: 'Homework', icon: IconBook, color: 'teal', studentOnly: true },
        { to: `/${slug}/student/schedule`, label: 'Class Schedule', icon: IconCalendar, color: 'green', studentOnly: true },
      ],
    },
    {
      label: 'Parent Portal',
      icon: IconUsers,
      color: 'cyan',
      items: [
        { to: `/${slug}/parent/dashboard`, label: 'My Children', icon: IconDashboard, color: 'blue', parentOnly: true },
        { to: `/${slug}/parent/homework`, label: 'Homework', icon: IconBook, color: 'teal', parentOnly: true },
        { to: `/${slug}/parent/attendance`, label: 'Attendance', icon: IconChecklist, color: 'lime', parentOnly: true },
      ],
    },
    {
      label: 'Reports',
      icon: IconReportAnalytics,
      color: 'red',
      items: [
        { to: `/${slug}/admin/reports/academic`, label: 'Academic Reports', icon: IconBook, color: 'red', adminOnly: true },
        { to: `/${slug}/admin/reports/attendance`, label: 'Attendance Summary', icon: IconChartBar, color: 'yellow', adminOnly: true },
        { to: `/${slug}/admin/reports/fees`, label: 'Fee Reports', icon: IconReceipt, color: 'orange', adminOnly: true },
      ],
    },
    {
      label: 'Administration',
      icon: IconShieldLock,
      color: 'violet',
      items: [
        { to: `/${slug}/admin/users`, label: 'User Management', icon: IconUsers, color: 'violet', adminOnly: true },
        { to: `/${slug}/admin/staff`, label: 'Staff Management', icon: IconBriefcase, color: 'grape', adminOnly: true },
        { to: `/${slug}/admin/settings`, label: 'General Settings', icon: IconSettings, color: 'gray', adminOnly: true },
      ],
    },
  ];
};

export function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();
  const [opened, { toggle }] = useDisclosure();
  const [activeAccordion, setActiveAccordion] = useState<string | null>(() => {
    // Auto-expand accordion based on current route
    const path = location.pathname;
    if (path.includes('/admin/')) return 'Academics';
    if (path.includes('/teacher/')) return 'My Classes';
    if (path.includes('/student/')) return 'Student Portal';
    if (path.includes('/parent/')) return 'Parent Portal';
    if (path.includes('/users') || path.includes('/staff')) return 'Administration';
    return 'Dashboard';
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userType = user.userType || user.role;
  const role = user.role;
  const schoolName = localStorage.getItem('schoolName') || 'Hamro Shiksha';
  const schoolSlug = slug || localStorage.getItem('schoolSlug');

  const isSuperAdmin = role === 'super_admin';

  const handleLogout = () => {
    localStorage.clear();
    if (isSuperAdmin) {
      navigate('/super-admin/login');
    } else if (schoolSlug) {
      navigate(`/${schoolSlug}/login`);
    } else {
      navigate('/signup');
    }
  };

  // Get navigation items based on user type
  const navGroups = getNavGroups(schoolSlug || '', userType, role);

  // Filter nav items based on user role
  const filteredNavGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.adminOnly && !(userType === 'school_admin' || role === 'admin' || role === 'super_admin')) return false;
      if (item.teacherOnly && userType !== 'teacher') return false;
      if (item.studentOnly && userType !== 'student') return false;
      if (item.parentOnly && userType !== 'parent') return false;
      return true;
    }),
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
              {schoolName}
            </Title>
          </Group>
          <Group visibleFrom="sm">
            <Text size="sm" c="dimmed" mr="md">{userType || role}</Text>
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <Avatar radius="xl" size="sm" color="blue" style={{ cursor: 'pointer' }}>
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{user.name || 'User'}</Menu.Label>
                <Menu.Label c="dimmed" size="xs">{user.email || user.rollNumber}</Menu.Label>
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
                  Logged in as: {user.name || userType || 'Unknown'}
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