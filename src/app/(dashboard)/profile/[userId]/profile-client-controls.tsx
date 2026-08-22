"use client";

import { useState } from "react";
import { toggleFollow } from "@/server/actions/profile";
import { useRouter } from "next/navigation";

export default function ProfileClientControls({
  targetUserId,
  initialIsFollowing,
}: {
  targetUserId: string;
  initialIsFollowing: boolean;
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleFollowToggle = async () => {
    setLoading(true);
    const res = await toggleFollow(targetUserId);
    if (res.success) {
      setIsFollowing(!isFollowing);
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleFollowToggle}
      disabled={loading}
      className={`px-6 py-2 rounded-lg font-medium transition-all ${
        isFollowing 
          ? "bg-surface-variant text-text-primary hover:bg-surface-3 border border-white/10" 
          : "bg-primary-gradient text-white shadow-glow-primary hover:scale-[1.02]"
      }`}
    >
      {loading ? "..." : isFollowing ? "Following" : "Follow"}
    </button>
  );
}
