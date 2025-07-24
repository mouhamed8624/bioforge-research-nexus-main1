
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProjectsDisplay } from "@/components/projects/ProjectsDisplay";
import { getGlobalTodoStats, type UserTodoStats } from '@/services/todos/todoService';
import { useEffect, useState } from 'react';

const ButtonProject = () => {
  const [userTodoStats, setUserTodoStats] = useState<UserTodoStats[]>([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const stats = await getGlobalTodoStats();
        setUserTodoStats(stats);
      } catch (e) {
        console.error('Error fetching user todo stats for project:', e);
      }
    }
    fetchStats();
  }, []);

  return (
    <MainLayout>
      <PageContainer 
        title="Button Project" 
        subtitle="Interactive project management with action buttons"
      >
        <ProjectsDisplay />
        {/* User Completed Task Hours Table */}
        <div className="mt-8">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">User Completed Task Hours</h2>
            <p className="text-gray-600 mb-4">Total hours of completed tasks per user</p>
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-gray-100 text-gray-900">
                    <th className="px-4 py-2 border font-semibold">User</th>
                    <th className="px-4 py-2 border font-semibold">Total Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {userTodoStats.length === 0 ? (
                    <tr><td colSpan={2} className="text-center py-6 text-gray-500">No completed tasks yet.</td></tr>
                  ) : (
                    userTodoStats.map((row) => (
                      <tr key={row.user} className="even:bg-gray-50">
                        <td className="px-4 py-2 border font-medium text-gray-900 whitespace-nowrap">{row.user}</td>
                        <td className="px-4 py-2 border text-center text-indigo-700 font-semibold">{row.totalHours.toFixed(2)} h</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </PageContainer>
    </MainLayout>
  );
};

export default ButtonProject;
