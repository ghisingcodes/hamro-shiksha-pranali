import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  Card, TextInput, PasswordInput, Button, Title, Stack, Alert, Text, 
  Select, Divider, Loader, Group, Image, Paper, Box
} from '@mantine/core';
import { api } from '../../lib/api';
import { notifications } from '@mantine/notifications';

const USER_TYPES = [
  { value: 'student', label: '👨‍🎓 Student Login' },
  { value: 'parent', label: '👪 Parent Login' },
  { value: 'teacher', label: '👩‍🏫 Teacher Login' },
];

// Generate year options (1970 to current year)
const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= 1970; i--) {
    years.push({ value: i.toString(), label: i.toString() });
  }
  return years;
};

const MONTH_OPTIONS = [
  { value: '0', label: 'January' },
  { value: '1', label: 'February' },
  { value: '2', label: 'March' },
  { value: '3', label: 'April' },
  { value: '4', label: 'May' },
  { value: '5', label: 'June' },
  { value: '6', label: 'July' },
  { value: '7', label: 'August' },
  { value: '8', label: 'September' },
  { value: '9', label: 'October' },
  { value: '10', label: 'November' },
  { value: '11', label: 'December' },
];

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({ value: (i + 1).toString(), label: (i + 1).toString() }));

export function SchoolLoginPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [userType, setUserType] = useState('student');
  const [error, setError] = useState('');
  
  // Common fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // Date of Birth fields (separate dropdowns)
  const [dobYear, setDobYear] = useState<string>('');
  const [dobMonth, setDobMonth] = useState<string>('');
  const [dobDay, setDobDay] = useState<string>('');
  
  // Student/Parent specific fields
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedRollNumber, setSelectedRollNumber] = useState('');
  
  // Fetch school data
  const { data: school, isLoading: schoolLoading } = useQuery({
    queryKey: ['school', slug],
    queryFn: () => api.get(`/schools/by-slug/${slug}`).then(res => res.data),
    enabled: !!slug,
  });

  // Fetch active season
  const { data: seasons, isLoading: seasonsLoading } = useQuery({
    queryKey: ['seasons', school?._id],
    queryFn: () => api.get('/academic-seasons', { headers: { 'X-School-Id': school?._id } }).then(res => res.data),
    enabled: !!school?._id,
  });

  const activeSeason = seasons?.find((s: any) => s.isActive);

  // Fetch all classes for the school
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['classes', school?._id],
    queryFn: () => api.get('/classes', { headers: { 'X-School-Id': school?._id } }).then(res => res.data),
    enabled: !!school?._id,
  });

  // Format class options
  const classOptions = classes?.map((cls: any) => ({
    value: cls._id,
    label: cls.displayName,
  })) || [];

  // Fetch sections based on selected class
  const { 
    data: sections, 
    isLoading: sectionsLoading, 
    refetch: refetchSections 
  } = useQuery({
    queryKey: ['sections', selectedClassId, activeSeason?._id, school?._id],
    queryFn: async () => {
      if (!selectedClassId || !activeSeason?._id || !school?._id) return [];
      
      const res = await api.get(`/class-sections?seasonId=${activeSeason._id}&classId=${selectedClassId}`, {
        headers: { 'X-School-Id': school._id }
      });
      
      // Find the class section for the selected class
      const classSection = res.data.find((cs: any) => {
        const csClassId = typeof cs.classId === 'string' ? cs.classId : cs.classId?._id;
        return csClassId === selectedClassId;
      });
      
      return classSection?.sections?.map((s: any) => ({ value: s.name, label: s.name })) || [];
    },
    enabled: !!selectedClassId && !!activeSeason?._id && !!school?._id,
  });

  // Fetch roll numbers based on selected class and section
  const { 
    data: rollNumbers, 
    isLoading: rollNumbersLoading, 
    refetch: refetchRollNumbers 
  } = useQuery({
    queryKey: ['rollNumbers', selectedClassId, selectedSection, activeSeason?._id, school?._id],
    queryFn: async () => {
      if (!selectedClassId || !selectedSection || !activeSeason?._id || !school?._id) return [];
      
      const res = await api.get(`/academic-records?seasonId=${activeSeason._id}&classId=${selectedClassId}&section=${selectedSection}`, {
        headers: { 'X-School-Id': school._id }
      });
      
      return res.data.map((record: any) => ({
        value: record.rollNumber,
        label: `${record.rollNumber} - ${record.studentId?.name || 'Student'}`,
        studentId: record.studentId?._id,
        studentName: record.studentId?.name,
      })).filter((r: any) => r.value);
    },
    enabled: !!selectedClassId && !!selectedSection && !!activeSeason?._id && !!school?._id,
  });

  // Fetch sections when class changes
  useEffect(() => {
    if (selectedClassId && activeSeason?._id && school?._id) {
      refetchSections();
      setSelectedSection('');
      setSelectedRollNumber('');
    }
  }, [selectedClassId, activeSeason?._id, school?._id]);

  // Fetch roll numbers when section changes
  useEffect(() => {
    if (selectedClassId && selectedSection && activeSeason?._id && school?._id) {
      refetchRollNumbers();
      setSelectedRollNumber('');
    }
  }, [selectedSection, activeSeason?._id, school?._id]);

  const loginMutation = useMutation({
    mutationFn: () => {
      const payload: any = { userType };
      
      if (userType === 'student') {
        // Combine date parts into a Date object
        let dateOfBirth = null;
        if (dobYear && dobMonth && dobDay) {
          dateOfBirth = new Date(parseInt(dobYear), parseInt(dobMonth), parseInt(dobDay));
        }
        payload.rollNumber = selectedRollNumber;
        payload.classId = selectedClassId;
        payload.section = selectedSection;
        payload.dateOfBirth = dateOfBirth;
      } else if (userType === 'parent') {
        payload.identifier = identifier;
        payload.rollNumber = selectedRollNumber;
        payload.classId = selectedClassId;
        payload.section = selectedSection;
      } else if (userType === 'teacher') {
        payload.identifier = identifier;
        payload.password = password;
      }
      
      return api.post(`/auth/${slug}/login`, payload);
    },
    onSuccess: (res) => {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('schoolId', school?._id);
      localStorage.setItem('schoolSlug', slug || '');
      if (res.data.user.schoolName) {
        localStorage.setItem('schoolName', res.data.user.schoolName);
      }
      notifications.show({ title: 'Success', message: 'Logged in successfully', color: 'green' });
      
      const userTypeRedirect = res.data.user.userType;
      if (userTypeRedirect === 'student') {
        navigate(`/${slug}/student/dashboard`);
      } else if (userTypeRedirect === 'parent') {
        navigate(`/${slug}/parent/dashboard`);
      } else if (userTypeRedirect === 'teacher') {
        navigate(`/${slug}/teacher/dashboard`);
      } else {
        navigate(`/${slug}/admin/dashboard`);
      }
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Login failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userType === 'student') {
      if (!selectedRollNumber || !selectedClassId || !selectedSection || !dobYear || !dobMonth || !dobDay) {
        setError('Please fill all fields');
        return;
      }
    } else if (userType === 'parent') {
      if (!identifier || !selectedRollNumber || !selectedClassId || !selectedSection) {
        setError('Please fill all fields');
        return;
      }
    } else if (userType === 'teacher') {
      if (!identifier || !password) {
        setError('Please fill all fields');
        return;
      }
    }
    
    loginMutation.mutate();
  };

  const resetForm = () => {
    setError('');
    setIdentifier('');
    setPassword('');
    setDobYear('');
    setDobMonth('');
    setDobDay('');
    setSelectedClassId('');
    setSelectedSection('');
    setSelectedRollNumber('');
  };

  if (schoolLoading || seasonsLoading || classesLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader />
      </div>
    );
  }

  if (!school) {
    navigate('/school-not-found');
    return null;
  }

  const isLoadingFields = sectionsLoading || rollNumbersLoading;

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundImage: school?.coverPhoto ? `url(${school.coverPhoto})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      padding: '20px'
    }}>
      <Card withBorder shadow="xl" p="xl" radius="md" style={{ width: '100%', maxWidth: 550, backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
        <Stack align="center" mb="lg">
          {school?.schoolLogo && <Image src={school.schoolLogo} alt={school.name} height={80} fit="contain" />}
          <Title order={2} style={{ color: school?.themeColor || '#1e5a7a' }}>{school.name}</Title>
          <Text c="dimmed" size="sm">Login to your account</Text>
        </Stack>

        <Select
          label="Login As"
          data={USER_TYPES}
          value={userType}
          onChange={(val) => { setUserType(val || 'student'); resetForm(); }}
          mb="md"
        />

        <form onSubmit={handleSubmit}>
          <Stack>
            {error && <Alert color="red">{error}</Alert>}
            
            {userType === 'student' && (
              <>
                <Select
                  label="Class"
                  placeholder="Select class"
                  data={classOptions}
                  value={selectedClassId}
                  onChange={(val) => {
                    setSelectedClassId(val || '');
                    setSelectedSection('');
                    setSelectedRollNumber('');
                  }}
                  required
                  searchable
                />
                
                <Select
                  label="Section"
                  placeholder="Select section"
                  data={sections || []}
                  value={selectedSection}
                  onChange={(val) => {
                    setSelectedSection(val || '');
                    setSelectedRollNumber('');
                  }}
                  disabled={!selectedClassId || sectionsLoading}
                  rightSection={sectionsLoading ? <Loader size="xs" /> : null}
                  required
                  searchable
                />
                
                <Select
                  label="Roll Number"
                  placeholder="Select roll number"
                  data={rollNumbers || []}
                  value={selectedRollNumber}
                  onChange={setSelectedRollNumber}
                  disabled={!selectedSection || rollNumbersLoading}
                  rightSection={rollNumbersLoading ? <Loader size="xs" /> : null}
                  required
                  searchable
                />
                
                <Divider label="Date of Birth" labelPosition="center" />
                <Group grow>
                  <Select
                    label="Year"
                    placeholder="Year"
                    data={getYearOptions()}
                    value={dobYear}
                    onChange={setDobYear}
                    required
                    searchable
                  />
                  <Select
                    label="Month"
                    placeholder="Month"
                    data={MONTH_OPTIONS}
                    value={dobMonth}
                    onChange={setDobMonth}
                    required
                  />
                  <Select
                    label="Day"
                    placeholder="Day"
                    data={DAY_OPTIONS}
                    value={dobDay}
                    onChange={setDobDay}
                    required
                  />
                </Group>
              </>
            )}

            {userType === 'parent' && (
              <>
                <TextInput
                  label="Mobile Number or Email"
                  placeholder="Enter registered mobile number or email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
                <Divider label="Child's Information" labelPosition="center" />
                
                <Select
                  label="Class"
                  placeholder="Select class"
                  data={classOptions}
                  value={selectedClassId}
                  onChange={(val) => {
                    setSelectedClassId(val || '');
                    setSelectedSection('');
                    setSelectedRollNumber('');
                  }}
                  required
                  searchable
                />
                
                <Select
                  label="Section"
                  placeholder="Select section"
                  data={sections || []}
                  value={selectedSection}
                  onChange={(val) => {
                    setSelectedSection(val || '');
                    setSelectedRollNumber('');
                  }}
                  disabled={!selectedClassId || sectionsLoading}
                  rightSection={sectionsLoading ? <Loader size="xs" /> : null}
                  required
                  searchable
                />
                
                <Select
                  label="Roll Number"
                  placeholder="Select roll number"
                  data={rollNumbers || []}
                  value={selectedRollNumber}
                  onChange={setSelectedRollNumber}
                  disabled={!selectedSection || rollNumbersLoading}
                  rightSection={rollNumbersLoading ? <Loader size="xs" /> : null}
                  required
                  searchable
                />
              </>
            )}

            {userType === 'teacher' && (
              <>
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
              </>
            )}
            
            <Button 
              type="submit" 
              loading={loginMutation.isPending || isLoadingFields} 
              fullWidth 
              mt="md"
              style={{ backgroundColor: school?.themeColor || '#1e5a7a' }}
              disabled={isLoadingFields}
            >
              Login
            </Button>
          </Stack>
        </form>
      </Card>
    </div>
  );
}