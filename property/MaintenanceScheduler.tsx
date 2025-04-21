
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Tool } from 'lucide-react';

interface MaintenanceTask {
  id: string;
  title: string;
  date: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed';
}

export function MaintenanceScheduler() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Maintenance Schedule</CardTitle>
          <Button size="sm">Add Task</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Calendar />
          <div className="space-y-2">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {task.date.toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={task.priority === 'high' ? 'destructive' : 'outline'}>
                  {task.priority}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
