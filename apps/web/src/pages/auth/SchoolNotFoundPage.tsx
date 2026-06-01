import { Container, Stack, Title, Text, Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

export function SchoolNotFoundPage() {
  const navigate = useNavigate();
  return (
    <Container size="sm" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack align="center" gap="md">
        <Title order={1}>🏫 School Not Found</Title>
        <Text c="dimmed" ta="center">
          The school you're looking for doesn't exist or has been deactivated.
          Please check the URL or contact the school administrator.
        </Text>
        <Button onClick={() => navigate('/')}>Go to Home</Button>
      </Stack>
    </Container>
  );
}