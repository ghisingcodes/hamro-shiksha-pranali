import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Card, TextInput, PasswordInput, Button, Title, Stack, Alert, Text, Divider } from '@mantine/core';
import { api } from '../../lib/api';
import { notifications } from '@mantine/notifications';

export function SchoolSignupPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    schoolName: '',
    schoolAddress: '',
    schoolPhone: '',
    schoolEmail: '',
    panNumber: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    adminPhone: '',
  });

  const signupMutation = useMutation({
    mutationFn: () => api.post('/auth/school-signup', formData),
    onSuccess: (res) => {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      if (res.data.user.schoolName) {
        localStorage.setItem('school', JSON.stringify({ name: res.data.user.schoolName, id: res.data.user.schoolId }));
      }
      notifications.show({ title: 'Success', message: 'School registered successfully!', color: 'green' });
      navigate('/');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Registration failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.schoolName || !formData.adminName || !formData.adminEmail || !formData.adminPassword) {
      setError('Please fill all required fields');
      return;
    }
    signupMutation.mutate();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa', padding: '20px' }}>
      <Card withBorder shadow="md" p="xl" radius="md" style={{ width: '100%', maxWidth: 600 }}>
        <Title order={2} ta="center">Register Your School</Title>
        <Text c="dimmed" ta="center" size="sm" mb="lg">Create a new school account</Text>

        <form onSubmit={handleSubmit}>
          <Stack>
            {error && <Alert color="red">{error}</Alert>}

            <Divider label="School Information" labelPosition="center" />
            
            <TextInput label="School Name *" placeholder="Enter school name" value={formData.schoolName} onChange={(e) => setFormData({...formData, schoolName: e.target.value})} required />
            <TextInput label="School Address" placeholder="Enter address" value={formData.schoolAddress} onChange={(e) => setFormData({...formData, schoolAddress: e.target.value})} />
            <TextInput label="School Phone" placeholder="Phone number" value={formData.schoolPhone} onChange={(e) => setFormData({...formData, schoolPhone: e.target.value})} />
            <TextInput label="School Email" placeholder="Email" value={formData.schoolEmail} onChange={(e) => setFormData({...formData, schoolEmail: e.target.value})} />
            <TextInput label="PAN Number" placeholder="PAN number" value={formData.panNumber} onChange={(e) => setFormData({...formData, panNumber: e.target.value})} />

            <Divider label="Super Admin Account" labelPosition="center" />

            <TextInput label="Admin Name *" placeholder="Full name" value={formData.adminName} onChange={(e) => setFormData({...formData, adminName: e.target.value})} required />
            <TextInput label="Admin Email *" placeholder="email@example.com" value={formData.adminEmail} onChange={(e) => setFormData({...formData, adminEmail: e.target.value})} required />
            <PasswordInput label="Admin Password *" placeholder="Create password" value={formData.adminPassword} onChange={(e) => setFormData({...formData, adminPassword: e.target.value})} required />
            <TextInput label="Admin Phone" placeholder="Phone number" value={formData.adminPhone} onChange={(e) => setFormData({...formData, adminPhone: e.target.value})} />

            <Button type="submit" loading={signupMutation.isPending} fullWidth mt="md">Register School</Button>
            <Text ta="center" size="sm">Already have an account? <Button variant="subtle" onClick={() => navigate('/login')}>Login</Button></Text>
          </Stack>
        </form>
      </Card>
    </div>
  );
}