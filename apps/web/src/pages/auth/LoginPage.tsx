import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  Card, TextInput, PasswordInput, Button, Title, Stack, Alert, Text, 
  Select, Divider, Paper, Loader
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { api } from '../../lib/api';
import { notifications } from '@mantine/notifications';

const USER_TYPES = [
  { value: 'student', label: '👨‍🎓 Student Login' },
  { value: 'parent', label: '👪 Parent Login' },
  { value: 'teacher', label: '👩‍🏫 Teacher Login' },
  { value: 'admin', label: '🔐 Admin/Staff Login' },
];

const CLASS_OPTIONS = [
  'Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 
  'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'
];

export function LoginPage() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState('student');
  const [error, setError] = useState('');
  
  // Common fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // Student/Parent specific fields
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  
  // Fetch sections when class changes
  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ['sections', className],
    queryFn: async () => {
      if (!className) return [];
      // Get active season first
      const seasons = await api.get('/academic-seasons').then(res => res.data);
      const activeSeason = seasons.find((s: any) => s.isActive);
      if (!activeSeason) return [];
      const schoolId = localStorage.getItem('schoolId');
      const res = await api.get(`/class-sections/sections/by-class?classId=${className}&seasonId=${activeSeason._id}`, {
        headers: { 'X-School-Id': schoolId || '' }
      });
      return res.data;
    },
    enabled: !!className,
  });

  const loginMutation = useMutation({
    mutationFn: () => {
      const payload: any = { userType };
      
      if (userType === 'student') {
        payload.rollNumber = rollNumber;
        payload.className = className;
        payload.section = section;
        payload.dateOfBirth = dateOfBirth;
      } else if (userType === 'parent') {
        payload.identifier = identifier;
        payload.rollNumber = rollNumber;
        payload.className = className;
        payload.section = section;
      } else if (userType === 'teacher' || userType === 'admin') {
        payload.identifier = identifier;
        payload.password = password;
      }
      
      return api.post('/auth/login', payload);
    },
    onSuccess: (res) => {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      if (res.data.user.schoolId) {
        localStorage.setItem('schoolId', res.data.user.schoolId);
      }
      notifications.show({ title: 'Success', message: 'Logged in successfully', color: 'green' });
      
      // Redirect based on user type
      const userTypeRedirect = res.data.user.userType;
      if (userTypeRedirect === 'student') {
        navigate('/student/dashboard');
      } else if (userTypeRedirect === 'parent') {
        navigate('/parent/dashboard');
      } else if (userTypeRedirect === 'teacher') {
        navigate('/teacher/dashboard');
      } else if (userTypeRedirect === 'staff') {
        navigate('/staff/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Login failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userType === 'student') {
      if (!rollNumber || !className || !section || !dateOfBirth) {
        setError('Please fill all fields');
        return;
      }
    } else if (userType === 'parent') {
      if (!identifier || !rollNumber || !className || !section) {
        setError('Please fill all fields');
        return;
      }
    } else if (userType === 'teacher' || userType === 'admin') {
      if (!identifier || !password) {
        setError('Please fill all fields');
        return;
      }
    }
    
    loginMutation.mutate();
  };

  const renderStudentForm = () => (
    <Stack>
      <TextInput
        label="Roll Number"
        placeholder="Enter roll number"
        value={rollNumber}
        onChange={(e) => setRollNumber(e.target.value)}
        required
      />
      <Select
        label="Class"
        placeholder="Select class"
        data={CLASS_OPTIONS}
        value={className}
        onChange={(val) => {
          setClassName(val || '');
          setSection('');
        }}
        required
      />
      <Select
        label="Section"
        placeholder="Select section"
        data={sections || []}
        value={section}
        onChange={setSection}
        disabled={!className || sectionsLoading}
        rightSection={sectionsLoading ? <Loader size="xs" /> : null}
        required
      />
      <DatePicker
        label="Date of Birth"
        placeholder="Select date of birth"
        value={dateOfBirth}
        onChange={setDateOfBirth}
        required
      />
    </Stack>
  );

  const renderParentForm = () => (
    <Stack>
      <TextInput
        label="Mobile Number or Email"
        placeholder="Enter registered mobile number or email"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        required
      />
      <Divider label="Child's Information" labelPosition="center" />
      <TextInput
        label="Roll Number"
        placeholder="Enter child's roll number"
        value={rollNumber}
        onChange={(e) => setRollNumber(e.target.value)}
        required
      />
      <Select
        label="Class"
        placeholder="Select class"
        data={CLASS_OPTIONS}
        value={className}
        onChange={(val) => {
          setClassName(val || '');
          setSection('');
        }}
        required
      />
      <Select
        label="Section"
        placeholder="Select section"
        data={sections || []}
        value={section}
        onChange={setSection}
        disabled={!className || sectionsLoading}
        rightSection={sectionsLoading ? <Loader size="xs" /> : null}
        required
      />
    </Stack>
  );

  const renderTeacherForm = () => (
    <Stack>
      <TextInput
        label="Email or Mobile Number"
        placeholder="Enter email or mobile number"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        required
      />
      <PasswordInput
        label="Password"
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
    </Stack>
  );

  const renderAdminForm = () => (
    <Stack>
      <TextInput
        label="Email"
        placeholder="Enter email"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        required
      />
      <PasswordInput
        label="Password"
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
    </Stack>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa', padding: '20px' }}>
      <Card withBorder shadow="md" p="xl" radius="md" style={{ width: '100%', maxWidth: 500 }}>
        <Title order={2} ta="center">Hamro Shiksha Pranali</Title>
        <Text c="dimmed" ta="center" size="sm" mb="lg">Login to your account</Text>

        <Select
          label="Login As"
          data={USER_TYPES}
          value={userType}
          onChange={(val) => {
            setUserType(val || 'student');
            setError('');
            setIdentifier('');
            setPassword('');
            setRollNumber('');
            setClassName('');
            setSection('');
            setDateOfBirth(null);
          }}
          mb="md"
        />

        <form onSubmit={handleSubmit}>
          <Stack>
            {error && <Alert color="red">{error}</Alert>}
            
            {userType === 'student' && renderStudentForm()}
            {userType === 'parent' && renderParentForm()}
            {userType === 'teacher' && renderTeacherForm()}
            {userType === 'admin' && renderAdminForm()}
            
            <Button type="submit" loading={loginMutation.isPending} fullWidth mt="md">
              Login
            </Button>
            
            {userType === 'admin' && (
              <Text ta="center" size="sm">
                Don't have an account?{' '}
                <Button variant="subtle" onClick={() => navigate('/signup')} style={{ display: 'inline-block', padding: 0 }}>
                  Register School
                </Button>
              </Text>
            )}
          </Stack>
        </form>
      </Card>
    </div>
  );
}