import { useState, useEffect } from 'react';
import { Users, BookOpen, TrendingUp, Award, Calendar, MessageCircle, FileText, Loader, Gamepad2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import GameAnalyticsDashboard from '../components/analytics/GameAnalyticsDashboard';
import { useApp } from '../contexts/AppContext';

export default function TeacherDashboard() {
  const { setCurrentScreen, setSelectedRoom } = useApp();
  const [loading, setLoading] = useState(true);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [allAssignments, setAllAssignments] = useState<any[]>([]);
  const [roomMembers, setRoomMembers] = useState<{ [roomId: string]: any[] }>({});
  const [selectedRoomForAnalytics, setSelectedRoomForAnalytics] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const { roomService, userService, assignmentService } = await import('../services');

      // Load classrooms (rooms)
      const rooms = await roomService.getMyRooms().catch(() => []);
      setClassrooms(Array.isArray(rooms) ? rooms : []);

      // Load dashboard stats
      const dashboardStats = await userService.getMyStats().catch(() => null);
      setStats(dashboardStats);

      // Load assignments for all rooms
      const assignmentsPromises = (Array.isArray(rooms) ? rooms : []).map((room: any) =>
        assignmentService.getRoomAssignments(room.id).catch(() => [])
      );
      const assignmentsArrays = await Promise.all(assignmentsPromises);
      const allAssignmentsFlat = assignmentsArrays.flat().filter(Boolean);
      setAllAssignments(allAssignmentsFlat);

      // Load members for each room
      const membersPromises = (Array.isArray(rooms) ? rooms : []).map(async (room: any) => {
        const members = await roomService.getRoomMembers(room.id).catch(() => []);
        return { roomId: room.id, members: Array.isArray(members) ? members : [] };
      });
      const membersResults = await Promise.all(membersPromises);
      const membersMap: { [roomId: string]: any[] } = {};
      membersResults.forEach(({ roomId, members }) => {
        membersMap[roomId] = members;
      });
      setRoomMembers(membersMap);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterRoom = (room: any) => {
    setSelectedRoom(room);
    setCurrentScreen('subject-room');
  };

  const handleViewDetails = (room: any) => {
    setSelectedRoom(room);
    setCurrentScreen('subject-room');
  };

  const handleCreateAssignment = () => {
    // Navigate to first room or show modal
    if (classrooms.length > 0) {
      setSelectedRoom(classrooms[0]);
      setCurrentScreen('subject-room');
    } else {
      alert('Please create a classroom first');
    }
  };

  // Calculate stats from real data
  const totalStudents = Object.values(roomMembers).reduce((sum, members) => sum + (members?.length || 0), 0);
  const totalClasses = classrooms.length;
  const pendingAssignments = allAssignments.filter((a: any) => {
    const dueDate = new Date(a.due_date);
    return dueDate >= new Date() && !a.completed;
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-light-text-secondary dark:text-dark-text-secondary flex items-center gap-2">
          <Loader className="w-5 h-5 animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
            Teacher Dashboard
          </h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Manage your classes and track student progress
          </p>
        </div>
        <Button onClick={handleCreateAssignment}>
          <FileText className="w-5 h-5" />
          Create Assignment
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="p-2 bg-primary/10 rounded-button mb-2 w-fit">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">{totalStudents}</p>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Total Students</p>
          <Badge variant="success" size="sm" className="mt-2">{totalClasses} Classes</Badge>
        </Card>

        <Card className="p-6">
          <div className="p-2 bg-success/10 rounded-button mb-2 w-fit">
            <BookOpen className="w-5 h-5 text-success" />
          </div>
          <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">{totalClasses}</p>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Active Classes</p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-xs text-success font-medium">Active</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="p-2 bg-warning/10 rounded-button mb-2 w-fit">
            <FileText className="w-5 h-5 text-warning" />
          </div>
          <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">{pendingAssignments}</p>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Pending Assignments</p>
          <Badge variant="warning" size="sm" className="mt-2">Due Soon</Badge>
        </Card>

        <Card className="p-6">
          <div className="p-2 bg-accent/10 rounded-button mb-2 w-fit">
            <Award className="w-5 h-5 text-accent" />
          </div>
          <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            {stats?.average_grade || 'N/A'}
          </p>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Class Average</p>
          {stats?.average_grade && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-xs text-success font-medium">Active</span>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-6">
              Your Classrooms
            </h3>
            {classrooms.length === 0 ? (
              <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
                No classrooms yet. Create one to get started!
              </div>
            ) : (
              <div className="space-y-4">
                {classrooms.map((classroom) => {
                  const members = roomMembers[classroom.id] || [];
                  return (
                    <Card key={classroom.id} hover className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">
                            {classroom.name}
                          </h4>
                          <div className="flex items-center gap-3 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                            <span>{members.length} students</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-success rounded-full"></span>
                              <span>{members.length} members</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="primary">{classroom.subject}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEnterRoom(classroom)}
                        >
                          <MessageCircle className="w-4 h-4" />
                          Enter Room
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(classroom)}
                        >
                          View Details
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-6">
              Recent Assignments
            </h3>
            {allAssignments.length === 0 ? (
              <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
                No assignments yet. Create one to get started!
              </div>
            ) : (
              <div className="space-y-3">
                {allAssignments.slice(0, 5).map((assignment: any) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-4 rounded-button bg-light-bg dark:bg-dark-bg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-primary/10 rounded-button">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                          {assignment.title}
                        </p>
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                          Due: {new Date(assignment.due_date).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="primary">{assignment.assignment_type}</Badge>
                      {assignment.total_points > 0 && (
                        <Badge variant="neutral">{assignment.total_points} pts</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-button">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                Class Analytics
              </h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-button bg-light-bg dark:bg-dark-bg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    Total Classes
                  </p>
                </div>
                <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                  {totalClasses}
                </p>
              </div>
              <div className="p-4 rounded-button bg-light-bg dark:bg-dark-bg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    Total Students
                  </p>
                </div>
                <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                  {totalStudents}
                </p>
              </div>
              <div className="p-4 rounded-button bg-light-bg dark:bg-dark-bg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    Assignments
                  </p>
                </div>
                <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                  {allAssignments.length}
                </p>
              </div>
            </div>
          </Card>

          {classrooms.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-warning/10 rounded-button">
                  <Calendar className="w-5 h-5 text-warning" />
                </div>
                <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                  Upcoming Classes
                </h3>
              </div>

              <div className="space-y-3">
                {classrooms.slice(0, 3).map((classroom) => (
                  <div
                    key={classroom.id}
                    className="p-3 rounded-button bg-light-bg dark:bg-dark-bg cursor-pointer hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors"
                    onClick={() => handleEnterRoom(classroom)}
                  >
                    <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
                      {classroom.name}
                    </p>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-2">
                      {classroom.subject}
                    </p>
                    <Badge variant="primary" size="sm">
                      {roomMembers[classroom.id]?.length || 0} students
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Game Analytics Section */}
      {classrooms.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
              <Gamepad2 className="w-5 h-5" />
              Game Analytics
            </h2>
            {classrooms.length > 1 && (
              <select
                className="px-3 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-bg dark:bg-dark-bg text-light-text-primary dark:text-dark-text-primary text-sm"
                onChange={(e) => setSelectedRoomForAnalytics(e.target.value)}
                value={selectedRoomForAnalytics || classrooms[0]?.id || ''}
              >
                {classrooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <GameAnalyticsDashboard roomID={selectedRoomForAnalytics || classrooms[0]?.id} />
        </div>
      )}
    </div>
  );
}
