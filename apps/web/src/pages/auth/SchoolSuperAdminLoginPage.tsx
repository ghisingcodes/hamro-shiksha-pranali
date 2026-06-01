import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, TextInput, PasswordInput, Button, Title, Stack, Alert, Text, Image, Loader } from '@mantine/core';
import { api } from '../../lib/api';
import { notifications } from '@mantine/notifications';

export function SchoolSuperAdminLoginPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Fetch school data for branding
  const { data: school, isLoading: schoolLoading } = useQuery({
    queryKey: ['school', slug],
    queryFn: () => api.get(`/schools/by-slug/${slug}`).then(res => res.data),
    enabled: !!slug,
  });

  const loginMutation = useMutation({
    mutationFn: () => api.post(`/auth/${slug}/super-admin/login`, { identifier, password }),
    onSuccess: (res) => {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('schoolId', res.data.user.schoolId);
      localStorage.setItem('schoolSlug', slug || '');
      notifications.show({ title: 'Success', message: 'Logged in successfully', color: 'green' });
      navigate(`/${slug}/admin/dashboard`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Login failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please fill all fields');
      return;
    }
    loginMutation.mutate();
  };

  if (schoolLoading) {
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

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundImage: school?.coverPhoto ? `url(${school.coverPhoto})` : 'linear-gradient(135deg, #1e5a7a 0%, #0e3a52 100%)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      padding: '20px'
    }}>
      <Card withBorder shadow="xl" p="xl" radius="md" style={{ width: '100%', maxWidth: 450, backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
        <Stack align="center" mb="lg">
          {school?.schoolLogo && <Image src={school.schoolLogo} alt={school.name} height={80} fit="contain" />}
          <Title order={2} style={{ color: school?.themeColor || '#1e5a7a' }}>{school.name}</Title>
          <Text c="dimmed" size="sm">Administrator Login</Text>
        </Stack>

        <form onSubmit={handleSubmit}>
          <Stack>
            {error && <Alert color="red">{error}</Alert>}
            <TextInput 
              label="Email or Phone" 
              placeholder="admin@school.com" 
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
            <Button 
              type="submit" 
              loading={loginMutation.isPending} 
              fullWidth 
              style={{ backgroundColor: school?.themeColor || '#1e5a7a' }}
            >
              Login as Administrator
            </Button>
          </Stack>
        </form>
      </Card>
    </div>
  );
}