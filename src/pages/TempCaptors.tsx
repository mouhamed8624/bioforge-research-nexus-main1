import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Plus, Eye } from 'lucide-react';

// Mock data for captors and readings
const initialCaptors = [
  {
    id: '1',
    name: 'Freezer 1',
    location: 'Lab A',
    status: 'active',
    type: 'Freezer',
    lastReading: { value: -20.3, timestamp: '2024-06-19 10:00' },
    readings: [
      { value: -20.3, timestamp: '2024-06-19 10:00' },
      { value: -19.8, timestamp: '2024-06-19 09:00' },
      { value: -20.1, timestamp: '2024-06-19 08:00' },
    ],
  },
  {
    id: '2',
    name: 'Incubator 2',
    location: 'Lab B',
    status: 'inactive',
    type: 'Incubator',
    lastReading: { value: 37.0, timestamp: '2024-06-19 10:00' },
    readings: [
      { value: 37.0, timestamp: '2024-06-19 10:00' },
      { value: 36.8, timestamp: '2024-06-19 09:00' },
      { value: 37.1, timestamp: '2024-06-19 08:00' },
    ],
  },
];

export default function TempCaptors() {
  const [captors, setCaptors] = useState(initialCaptors);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCaptor, setNewCaptor] = useState({ name: '', location: '', type: 'Freezer' });
  const [selectedCaptor, setSelectedCaptor] = useState<typeof initialCaptors[0] | null>(null);

  const handleAddCaptor = () => {
    if (!newCaptor.name.trim() || !newCaptor.location.trim()) return;
    setCaptors([
      ...captors,
      {
        id: (captors.length + 1).toString(),
        name: newCaptor.name,
        location: newCaptor.location,
        status: 'active',
        type: newCaptor.type,
        lastReading: { value: 0, timestamp: '' },
        readings: [],
      },
    ]);
    setNewCaptor({ name: '', location: '', type: 'Freezer' });
    setShowAddDialog(false);
  };

  return (
    <div className="max-w-5xl mx-auto py-10">
      {/* Notice: Not functional */}
      <div className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 rounded">
        <strong>Notice:</strong> This page is a UI demonstration only and is not yet functional. No real data is being tracked.
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-6 w-6 text-blue-600" />
            Temperature Captors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-muted-foreground">Track and monitor temperature sensors in your lab.</span>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Captor
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Reading</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {captors.map((captor) => (
                  <TableRow key={captor.id}>
                    <TableCell className="font-medium">{captor.name}</TableCell>
                    <TableCell>{captor.location}</TableCell>
                    <TableCell>{captor.type}</TableCell>
                    <TableCell>
                      <Badge variant={captor.status === 'active' ? 'default' : 'secondary'} className={captor.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}>
                        {captor.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {captor.lastReading.value !== undefined ? `${captor.lastReading.value}°C` : '—'}
                      <span className="block text-xs text-muted-foreground">{captor.lastReading.timestamp}</span>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => setSelectedCaptor(captor)}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Captor Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Captor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Captor Name"
              value={newCaptor.name}
              onChange={e => setNewCaptor({ ...newCaptor, name: e.target.value })}
            />
            <Input
              placeholder="Location"
              value={newCaptor.location}
              onChange={e => setNewCaptor({ ...newCaptor, location: e.target.value })}
            />
            <select
              className="w-full border rounded px-3 py-2"
              value={newCaptor.type}
              onChange={e => setNewCaptor({ ...newCaptor, type: e.target.value })}
            >
              <option value="Freezer">Freezer</option>
              <option value="Incubator">Incubator</option>
              <option value="Refrigerator">Refrigerator</option>
              <option value="Room">Room</option>
            </select>
          </div>
          <DialogFooter>
            <Button onClick={handleAddCaptor}>Add Captor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Captor Readings Dialog */}
      <Dialog open={!!selectedCaptor} onOpenChange={() => setSelectedCaptor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Captor Readings: {selectedCaptor?.name}</DialogTitle>
          </DialogHeader>
          {selectedCaptor && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={selectedCaptor.status === 'active' ? 'default' : 'secondary'} className={selectedCaptor.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}>
                  {selectedCaptor.status}
                </Badge>
                <span className="text-muted-foreground text-xs">{selectedCaptor.type} in {selectedCaptor.location}</span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Temperature (°C)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCaptor.readings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">No readings yet</TableCell>
                      </TableRow>
                    ) : (
                      selectedCaptor.readings.map((reading, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{reading.timestamp}</TableCell>
                          <TableCell>{reading.value}°C</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 