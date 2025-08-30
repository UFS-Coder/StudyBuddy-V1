import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useTranslations } from "@/hooks/use-translations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { User, Settings, BookOpen, Calendar, CheckSquare, FileText, PenTool } from "lucide-react";
import { Navigate } from "react-router-dom";
import { ProfileSettings } from "@/components/profile/profile-settings";
import { AdminConsole } from "@/components/profile/admin-console";
import { Navbar } from "@/components/dashboard/navbar";
import { BottomNavigation } from "@/components/dashboard/bottom-navigation";

const Profile = () => {
  const { user, loading } = useAuth();
  const { data: profile } = useProfile();
  const { t } = useTranslations();

  const handleLanguageChange = (lang) => {
    console.log(`Language changed to: ${lang}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const studentName = profile?.display_name || user.email?.split('@')[0] || "Student";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Navbar 
        language="en" 
        onLanguageChange={handleLanguageChange} 
        studentName={studentName} 
        t={t} 
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{studentName}</CardTitle>
                  <p className="text-muted-foreground">{user.email}</p>
                  {profile?.grade_level && (
                    <p className="text-sm text-muted-foreground">Grade {profile.grade_level} • {profile.school}</p>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Profile Tabs */}
          <Tabs defaultValue="settings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Profile Settings
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <PenTool className="h-4 w-4" />
                Admin Console
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings">
              <ProfileSettings profile={profile} />
            </TabsContent>

            <TabsContent value="admin">
              <AdminConsole />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <BottomNavigation t={t} />
    </div>
  );
};

export default Profile;