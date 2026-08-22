"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/server/actions/user";
import { Camera, Loader2, X } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string | null;
    username: string | null;
    image: string | null;
    bio: string | null;
  };
}

export function EditProfileModal({ isOpen, onClose, user }: EditProfileModalProps) {
  const [name, setName] = useState(user.name || "");
  const [username, setUsername] = useState(user.username ? `@${user.username}` : "");
  const [bio, setBio] = useState(user.bio || "");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewImage = imageBase64 || user.image;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 80% quality
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setImageBase64(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await updateProfile({
        name,
        username,
        bio,
        imageBase64: imageBase64 || undefined,
      });

      if (res.success) {
        onClose();
      } else {
        setError(res.error || "Failed to update profile");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-surface-glass border-white/10 text-text-primary p-0 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
        <form onSubmit={handleSubmit} className="relative z-10 p-6 flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-headline-sm">Edit Profile</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-center mb-2">
            <div 
              className="relative w-24 h-24 rounded-full border-2 border-surface-variant bg-surface-2 overflow-hidden cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewImage ? (
                <Image src={previewImage} alt="Profile" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-text-muted">person</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium uppercase tracking-wider">Change</span>
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageSelect}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-text-secondary">Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="bg-surface-2/50 border-white/10 focus-visible:ring-primary"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username" className="text-text-secondary">Username</Label>
              <Input 
                id="username" 
                value={username} 
                onChange={(e) => {
                  let val = e.target.value;
                  if (val && !val.startsWith("@")) val = "@" + val;
                  setUsername(val);
                }} 
                placeholder="@username"
                className="bg-surface-2/50 border-white/10 focus-visible:ring-primary font-label-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-text-secondary">Bio</Label>
              <Textarea 
                id="bio" 
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                placeholder="Tell the community a bit about yourself..."
                className="bg-surface-2/50 border-white/10 focus-visible:ring-primary resize-none h-24"
                maxLength={300}
              />
              <p className="text-xs text-text-muted text-right">{bio.length}/300</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
              className="border-white/10 bg-surface-2/50 hover:bg-surface-variant hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !name.trim()}
              className="bg-primary-gradient text-white shadow-glow-primary border-none"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
