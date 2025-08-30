import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Profile } from "@/hooks/use-profile";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ProfileSettingsProps {
  profile: Profile | null;
}

export const ProfileSettings = ({ profile }: ProfileSettingsProps) => {
  const { user } = useAuth();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade_level">Grade Level</Label>
              <Select value={formData.grade_level} onValueChange={(value) => handleInputChange("grade_level", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade level" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      Grade {i + 1}
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
            />
          </div>

          <Button 
            type="submit" 
            disabled={updateProfileMutation.isPending}
            className="w-full md:w-auto"
          >
            {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};