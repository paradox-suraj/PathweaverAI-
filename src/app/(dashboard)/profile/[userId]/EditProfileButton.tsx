"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import { EditProfileModal } from "@/components/EditProfileModal";

interface Props {
  user: {
    name: string | null;
    username: string | null;
    image: string | null;
    bio: string | null;
  };
}

export function EditProfileButton({ user }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(true)}
        className="bg-surface-2/50 border-white/10 hover:bg-surface-variant hover:text-white"
      >
        <Edit2 className="w-4 h-4 mr-2" />
        Edit Profile
      </Button>

      {isOpen && (
        <EditProfileModal 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)} 
          user={user} 
        />
      )}
    </>
  );
}
