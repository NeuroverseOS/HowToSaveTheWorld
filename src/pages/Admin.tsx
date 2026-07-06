import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Shield, Users, BookOpen, RotateCcw, ArrowLeft } from "lucide-react";
import { resetEverything } from "@/lib/reset-state";

export default function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("user_reflections")
        .select("user_id")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get unique users
      const uniqueUsers = [...new Set(data?.map(r => r.user_id) || [])];
      setUsers(uniqueUsers.map(id => ({ id })));
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const handleResetOwnProgress = () => {
    if (confirm("Reset your own progress? This clears identity, missions, threads, and reflections on this device — you will restart from the beginning.")) {
      resetEverything();
      toast({
        title: "Progress Reset",
        description: "Returning to the beginning...",
      });
      setTimeout(() => { window.location.href = "/"; }, 1000);
    }
  };

  const handleResetUserProgress = async (userId: string) => {
    if (!confirm(`Reset progress for user ${userId}?`)) return;

    try {
      // Delete user's reflections and conversations
      await supabase.from("user_reflections").delete().eq("user_id", userId);
      await supabase.from("echelon_conversations").delete().eq("user_id", userId);

      toast({
        title: "User Progress Reset",
        description: "User's progress has been cleared from the database.",
      });
      loadUsers();
    } catch (error) {
      console.error("Error resetting user progress:", error);
      toast({
        title: "Error",
        description: "Failed to reset user progress.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-neuro-border bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-neuro-cyan" />
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-neuro-cyan to-neuro-purple bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 md:py-12">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-neuro-cyan/10">
                    <Users className="h-6 w-6 text-neuro-cyan" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold">{users.length}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-neuro-purple/10">
                    <BookOpen className="h-6 w-6 text-neuro-purple" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Lessons</p>
                    <p className="text-2xl font-bold">90</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-neuro-pink/10">
                    <Shield className="h-6 w-6 text-neuro-pink" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">System Status</p>
                    <p className="text-lg font-bold text-green-500">Operational</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border">
              <h3 className="text-lg font-semibold mb-4 text-neuro-cyan">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={handleResetOwnProgress}
                  variant="outline"
                  className="w-full justify-start border-neuro-border hover:bg-neuro-cyan/10"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset My Progress
                </Button>
                <Button
                  onClick={() => navigate("/assessment")}
                  variant="outline"
                  className="w-full justify-start border-neuro-border hover:bg-neuro-purple/10"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Retake Assessment
                </Button>
                <Button
                  onClick={() => navigate("/orientation")}
                  variant="outline"
                  className="w-full justify-start border-neuro-border hover:bg-neuro-pink/10"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  View Orientation
                </Button>
                <Button
                  onClick={() => navigate("/admin/import-lessons")}
                  variant="outline"
                  className="w-full justify-start border-neuro-border hover:bg-neuro-purple/10"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Import Lessons
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border">
              <h3 className="text-lg font-semibold mb-4 text-neuro-cyan">User Management</h3>
              <div className="space-y-3">
                {users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No users found</p>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-neuro-border/50 hover:bg-neuro-surface/30"
                    >
                      <div>
                        <p className="text-sm font-medium">User ID: {user.id.slice(0, 8)}...</p>
                      </div>
                      <Button
                        onClick={() => handleResetUserProgress(user.id)}
                        variant="outline"
                        size="sm"
                        className="border-neuro-border text-xs"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reset
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Lessons Tab */}
          <TabsContent value="lessons" className="space-y-6">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border">
              <h3 className="text-lg font-semibold mb-4 text-neuro-cyan">Lesson Management</h3>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Manage lessons, import new content, and configure training modules.
                </p>
                <Button
                  onClick={() => navigate("/admin/import-lessons")}
                  className="bg-neuro-cyan hover:bg-neuro-cyan/90 text-background"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Go to Lesson Import
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border">
              <h3 className="text-lg font-semibold mb-4 text-neuro-cyan">System Settings</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Database Status</h4>
                  <p className="text-sm text-muted-foreground">
                    Connected to Lovable Cloud
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">AI Integration</h4>
                  <p className="text-sm text-muted-foreground">
                    Lovable AI Gateway: Active
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Admin Actions</h4>
                  <Button
                    onClick={handleResetOwnProgress}
                    variant="destructive"
                    className="w-full"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset My Training Progress
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
