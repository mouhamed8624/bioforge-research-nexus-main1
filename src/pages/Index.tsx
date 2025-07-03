
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, BarChart3, Users, ClipboardList, Calendar, FileSearch2, Settings, MessageSquare, ShoppingCart, ShieldCheck, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const Index = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cigass-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Hero section with login/settings button */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-cigass-800">Cigass</h1>
          
          <div className="flex gap-2">
            {isAuthenticated && (
              <Button asChild variant="outline">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            )}
            
            {isAuthenticated ? (
              <Button asChild variant="outline">
                <Link to="/settings">Settings</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/login">Login</Link>
              </Button>
            )}
          </div>
        </div>
        
        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardContent className="flex items-center space-x-4 p-4">
              <Sparkles className="text-purple-500 h-6 w-6" />
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Projects</h2>
                <p className="text-sm text-gray-500">Manage ongoing research initiatives.</p>
              </div>
              <Link to="/projects" className="ml-auto">
                <Badge variant="secondary">View</Badge>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardContent className="flex items-center space-x-4 p-4">
              <BarChart3 className="text-blue-500 h-6 w-6" />
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Finance</h2>
                <p className="text-sm text-gray-500">Track expenditures and revenue streams.</p>
              </div>
              <Link to="/finance" className="ml-auto">
                <Badge variant="secondary">View</Badge>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardContent className="flex items-center space-x-4 p-4">
              <Users className="text-teal-500 h-6 w-6" />
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Teams</h2>
                <p className="text-sm text-gray-500">Collaborate with research teams.</p>
              </div>
              <Link to="/teams" className="ml-auto">
                <Badge variant="secondary">View</Badge>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardContent className="flex items-center space-x-4 p-4">
              <ClipboardList className="text-orange-500 h-6 w-6" />
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Inventory</h2>
                <p className="text-sm text-gray-500">Manage lab equipment and supplies.</p>
              </div>
              <Link to="/inventory" className="ml-auto">
                <Badge variant="secondary">View</Badge>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardContent className="flex items-center space-x-4 p-4">
              <Calendar className="text-red-500 h-6 w-6" />
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Calendar</h2>
                <p className="text-sm text-gray-500">Schedule experiments and meetings.</p>
              </div>
              <Link to="/calendar" className="ml-auto">
                <Badge variant="secondary">View</Badge>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardContent className="flex items-center space-x-4 p-4">
              <FileSearch2 className="text-lime-500 h-6 w-6" />
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Data Visualization</h2>
                <p className="text-sm text-gray-500">Analyze research data.</p>
              </div>
              <Link to="/data-visualization" className="ml-auto">
                <Badge variant="secondary">View</Badge>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
