
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Crown, 
  Settings, 
  Microscope, 
  Briefcase, 
  Users, 
  MapPin, 
  DollarSign, 
  User 
} from "lucide-react";

interface RoleSelectionDialogProps {
  open: boolean;
  userId: string;
  onRoleSelected: () => void;
}

type UserRole = 
  | 'president' 
  | 'admin' 
  | 'lab' 
  | 'general_director' 
  | 'manager' 
  | 'field' 
  | 'front_desk' 
  | 'financial';

const roleConfig = {
  president: {
    title: "President",
    description: "Executive leadership with full system access",
    icon: Crown,
    color: "bg-cigass-600 hover:bg-cigass-700",
    badge: "bg-cigass-100 text-cigass-800"
  },
  admin: {
    title: "Administrator",
    description: "System administration and user management",
    icon: Settings,
    color: "bg-blue-600 hover:bg-blue-700",
    badge: "bg-blue-100 text-blue-800"
  },
  lab: {
    title: "Laboratory Staff",
    description: "Sample management and laboratory operations",
    icon: Microscope,
    color: "bg-cigass-500 hover:bg-cigass-600",
    badge: "bg-cigass-50 text-cigass-700"
  },
  general_director: {
    title: "General Director",
    description: "Strategic oversight and organizational management",
    icon: Briefcase,
    color: "bg-cigass-700 hover:bg-cigass-800",
    badge: "bg-cigass-100 text-cigass-900"
  },
  manager: {
    title: "Manager",
    description: "Team leadership and project coordination",
    icon: Users,
    color: "bg-blue-500 hover:bg-blue-600",
    badge: "bg-blue-50 text-blue-700"
  },
  field: {
    title: "Field Staff",
    description: "Field operations and data collection",
    icon: MapPin,
    color: "bg-teal-600 hover:bg-teal-700",
    badge: "bg-teal-100 text-teal-800"
  },
  front_desk: {
    title: "Front Desk",
    description: "Reception and patient coordination",
    icon: User,
    color: "bg-cigass-400 hover:bg-cigass-500",
    badge: "bg-cigass-50 text-cigass-600"
  },
  financial: {
    title: "Financial Staff",
    description: "Budget management and financial operations",
    icon: DollarSign,
    color: "bg-blue-400 hover:bg-blue-500",
    badge: "bg-blue-50 text-blue-600"
  }
};

export const RoleSelectionDialog = ({ open, userId, onRoleSelected }: RoleSelectionDialogProps) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [rolePassword, setRolePassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();

  const assignRoleMutation = useMutation({
    mutationFn: async (role: UserRole) => {
      // Insert into user_roles table AND update profile role in parallel
      const [{ error: roleError }, { error: profileError }] = await Promise.all([
        supabase
          .from("user_roles")
          .insert({
            user_id: userId,
            role: role
          }),
        supabase
          .from("profiles")
          .update({ role: role })
          .eq("id", userId)
      ]);
      
      if (roleError) throw roleError;
      if (profileError) throw profileError;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["userRoles"] });
      await refreshProfile();
      toast({
        title: "Role Assigned",
        description: `You have been assigned the ${roleConfig[selectedRole!].title} role.`,
      });
      setShowPasswordInput(false);
      setRolePassword("");
      setPasswordError(null);
      onRoleSelected();
      
      // Navigate to dashboard after state updates have had a chance to propagate
      setTimeout(() => navigate("/dashboard"), 0);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to assign role. Please try again.",
        variant: "destructive"
      });
      console.error("Error assigning role:", error);
    }
  });

  const handleRoleSelection = (role: UserRole) => {
    setSelectedRole(role);
    setShowPasswordInput(false);
    setRolePassword("");
    setPasswordError(null);
  };

  const handleShowPassword = () => {
    setShowPasswordInput(true);
    setPasswordError(null);
  };

  const handleConfirm = () => {
    if (!selectedRole) return;
    if (!showPasswordInput) {
      handleShowPassword();
      return;
    }
    setPasswordError(null);
    if (rolePassword.trim() !== selectedRole) {
      setPasswordError("Incorrect password for this role.");
      return;
    }
    assignRoleMutation.mutate(selectedRole);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto" 
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center pb-6">
          <DialogTitle className="text-2xl font-bold">Welcome to CIGASS</DialogTitle>
          <p className="text-muted-foreground">
            Please select your role to customize your experience. This is required to continue.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Object.entries(roleConfig).map(([roleKey, config]) => {
            const Icon = config.icon;
            const isSelected = selectedRole === roleKey;
            
            return (
              <Card 
                key={roleKey}
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? 'ring-2 ring-cigass-500 shadow-lg' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleRoleSelection(roleKey as UserRole)}
              >
                <CardHeader className="text-center pb-3">
                  <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${config.color} text-white mb-2`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{config.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-sm">
                    {config.description}
                  </CardDescription>
                  {isSelected && (
                    <Badge className={`mt-3 ${config.badge}`}>
                      Selected
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {showPasswordInput && selectedRole && (
          <div className="flex flex-col items-center gap-2 mb-4">
            <label htmlFor="role-password" className="text-sm font-medium text-gray-700">
              Enter password for <span className="font-bold">{roleConfig[selectedRole].title}</span>:
            </label>
            <input
              id="role-password"
              type="password"
              className="border rounded px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-cigass-500"
              value={rolePassword}
              onChange={(e) => setRolePassword(e.target.value)}
              autoFocus
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirm();
              }}
              disabled={assignRoleMutation.isPending}
            />
            {passwordError && (
              <span className="text-sm text-red-600">{passwordError}</span>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button 
            onClick={handleConfirm}
            disabled={!selectedRole || assignRoleMutation.isPending}
            className="bg-cigass-600 hover:bg-cigass-700 min-w-[120px]"
          >
            {assignRoleMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Assigning...
              </>
            ) : (
              showPasswordInput ? 'Confirm Role' : 'Continue'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
