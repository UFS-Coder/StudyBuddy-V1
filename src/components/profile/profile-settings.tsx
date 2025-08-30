import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCanEdit } from "@/hooks/use-parent-permissions";
import { Profile } from "@/hooks/use-profile";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCheck, Users, AlertTriangle } from "lucide-react";

interface ProfileSettingsProps {
  profile: Profile | null;
}

export const ProfileSettings = ({ profile }: ProfileSettingsProps) => {
  const { user } = useAuth();
  const canEdit = useCanEdit();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || "",
    bio: profile?.bio || "",
    grade_level: profile?.grade_level || "12",
    school: profile?.school || "UFS",
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            ...data,
          },
          {
            onConflict: "user_id",
          }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const switchAccountTypeMutation = useMutation({
    mutationFn: async (newAccountType: 'student' | 'parent') => {
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("profiles")
        .update({ account_type: newAccountType })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
       queryClient.invalidateQueries({ queryKey: ["parent-children"] });
       toast({
         title: "Account type updated",
         description: "Your account type has been successfully updated. Please refresh the page to see changes.",
       });
       // Refresh the page to update the UI
       window.location.reload();
     },
     onError: (error) => {
       console.error("Error updating account type:", error);
       toast({
         title: "Error",
         description: "Failed to update account type. Please try again.",
         variant: "destructive",
       });
     },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAccountTypeSwitch = (newAccountType: 'student' | 'parent') => {
    switchAccountTypeMutation.mutate(newAccountType);
  };

  const currentAccountType = profile?.account_type || 'student';
  const targetAccountType = currentAccountType === 'student' ? 'parent' : 'student';

  return (
    <div className="space-y-6">
      {/* Account Type Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentAccountType === 'parent' ? <Users className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
            Account Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Current account type:</span>
              <Badge variant={currentAccountType === 'parent' ? 'default' : 'secondary'} className="capitalize">
                {currentAccountType === 'parent' ? <Users className="h-3 w-3 mr-1" /> : <UserCheck className="h-3 w-3 mr-1" />}
                {currentAccountType}
              </Badge>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full md:w-auto"
                  disabled={!canEdit || switchAccountTypeMutation.isPending}
                >
                  {switchAccountTypeMutation.isPending ? "Switching..." : `Switch to ${targetAccountType}`}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Switch Account Type
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>
                      You are about to switch from <strong>{currentAccountType}</strong> to <strong>{targetAccountType}</strong> account.
                    </p>
                    <div className="bg-destructive/10 p-3 rounded-md border border-destructive/20">
                      <p className="text-sm font-medium text-destructive mb-2">⚠️ Important Warning:</p>
                      <ul className="text-sm text-destructive space-y-1">
                        {currentAccountType === 'student' ? (
                          <>
                            <li>• All your student data (Noten, homework, notes) will remain but become read-only</li>
                            <li>• You will gain access to parent features (child management, monitoring)</li>
                            <li>• You can switch back to student mode later if needed</li>
                          </>
                        ) : (
                          <>
                            <li>• You will lose access to parent features (child management, monitoring)</li>
                            <li>• All linked children will be disconnected from your account</li>
                            <li>• Your student data will become editable again</li>
                            <li>• You will need to re-link children if you switch back to parent mode</li>
                          </>
                        )}
                      </ul>
                    </div>
                    <p className="text-sm">
                      This action will refresh the page to apply changes. Are you sure you want to continue?
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => handleAccountTypeSwitch(targetAccountType)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Yes, Switch to {targetAccountType}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => handleInputChange("display_name", e.target.value)}
                placeholder="Enter your display name"
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade_level">Klassenstufe</Label>
              <Select value={formData.grade_level} onValueChange={(value) => handleInputChange("grade_level", value)} disabled={!canEdit}>
                <SelectTrigger>
                  <SelectValue placeholder="Klassenstufe auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      Klasse {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="school">School</Label>
              <Input
                id="school"
                value={formData.school}
                onChange={(e) => handleInputChange("school", e.target.value)}
                placeholder="Enter your school name"
                disabled={!canEdit}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              disabled={!canEdit}
            />
          </div>

          <Button 
            type="submit" 
            disabled={updateProfileMutation.isPending || !canEdit}
            className="w-full md:w-auto"
          >
            {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
          </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};