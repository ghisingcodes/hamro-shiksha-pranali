import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Card, TextInput, PasswordInput, Button, Title, Stack, Alert, Text } from '@mantine/core';
import { api } from '../../lib/api';
import { notifications } from '@mantine/notifications';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const loginMutation = useMutation({
    mutationFn: () => api.post('/auth/login', { email, password }),
    onSuccess: (res) => {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('schoolId', res.data.user.schoolId);
      if (res.data.user.schoolName) {
        localStorage.setItem('school', JSON.stringify({ name: res.data.user.schoolName, id: res.data.user.schoolId }));
      }
      notifications.show({ title: 'Success', message: 'Logged in successfully', color: 'green' });
      navigate('/');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Login failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill all fields');
      return;
    }
    loginMutation.mutate();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
      <Card withBorder shadow="md" p="xl" radius="md" style={{ width: '100%', maxWidth: 400 }}>
        <Title order={2} ta="center">Hamro Shiksha Pranali</Title>
        <Text c="dimmed" ta="center" size="sm" mb="lg">Login to your account</Text>

        <form onSubmit={handleSubmit}>
          <Stack>
            {error && <Alert color="red">{error}</Alert>}
            <TextInput label="Email" placeholder="admin@school.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <PasswordInput label="Password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" loading={loginMutation.isPending} fullWidth>Login</Button>
            <Text ta="center" size="sm">Don't have an account? <Button variant="subtle" onClick={() => navigate('/signup')}>Register School</Button></Text>
          </Stack>
        </form>
      </Card>
    </div>
  );
}