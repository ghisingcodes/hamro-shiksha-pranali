import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Seasons</CardTitle></CardHeader>
          <CardContent>Manage academic years</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Classes</CardTitle></CardHeader>
          <CardContent>Define class routines per period</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Teachers & Students</CardTitle></CardHeader>
          <CardContent>Manage staff and enrollments</CardContent>
        </Card>
      </div>
    </div>
  );
}