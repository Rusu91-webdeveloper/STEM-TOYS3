"use client";

import { useState } from "react";
import { AlertTriangle, Shield, User, Truck, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

type Role = "CUSTOMER" | "ADMIN" | "SUPPLIER" | "VISITOR";

interface RoleChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  currentRole: Role;
  onRoleChanged: () => void;
}

const roleLabels = {
  CUSTOMER: "Customer",
  ADMIN: "Admin",
  SUPPLIER: "Supplier",
  VISITOR: "Visitor",
};

const roleIcons = {
  CUSTOMER: User,
  ADMIN: Shield,
  SUPPLIER: Truck,
  VISITOR: Eye,
};

const roleDescriptions = {
  CUSTOMER: "Can browse and purchase products",
  ADMIN: "Full access to admin panel and system management",
  SUPPLIER: "Can manage products and view supplier dashboard",
  VISITOR: "Can view admin and supplier dashboards (read-only access)",
};

export function RoleChangeDialog({
  isOpen,
  onClose,
  userId,
  userName,
  currentRole,
  onRoleChanged,
}: RoleChangeDialogProps) {
  const [selectedRole, setSelectedRole] = useState<Role>(currentRole);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRoleChange = async () => {
    if (selectedRole === currentRole) {
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/customers/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to update role";
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (jsonError) {
          // If response is not valid JSON, use status text or default message
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      toast({
        title: "Role Updated",
        description: `${userName}'s role has been changed to ${roleLabels[selectedRole]}.`,
      });

      onRoleChanged();
      onClose();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const CurrentRoleIcon = roleIcons[currentRole];
  const SelectedRoleIcon = roleIcons[selectedRole];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Change User Role
          </DialogTitle>
          <DialogDescription>
            Change the role for <strong>{userName}</strong>. This will affect
            their access permissions across the platform.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Role Display */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CurrentRoleIcon className="h-4 w-4" />
              Current Role:{" "}
              <span className="font-medium">{roleLabels[currentRole]}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {roleDescriptions[currentRole]}
            </p>
          </div>

          {/* Role Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">New Role</label>
            <Select
              value={selectedRole}
              onValueChange={(value: Role) => setSelectedRole(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([role, label]) => {
                  const Icon = roleIcons[role as Role];
                  return (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Role Description */}
          {selectedRole !== currentRole && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <SelectedRoleIcon className="h-4 w-4" />
                New Role:{" "}
                <span className="font-medium">{roleLabels[selectedRole]}</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                {roleDescriptions[selectedRole]}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleRoleChange}
            disabled={isLoading || selectedRole === currentRole}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "Updating..." : "Update Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
