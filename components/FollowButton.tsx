"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface FollowButtonProps {
  userId: number;
  isFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({ userId, isFollowing, onFollowChange }: FollowButtonProps) {
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(isFollowing);

  const handleFollow = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      if (following) {
        // Unfollow
        const response = await fetch(`http://127.0.0.1:8000/api/follows/${userId}`, {
          method: "DELETE",
          headers,
        });
        
        if (response.ok) {
          setFollowing(false);
          onFollowChange?.(false);
        } else {
          console.error("Failed to unfollow user");
        }
      } else {
        // Follow
        const response = await fetch("http://127.0.0.1:8000/api/follows/", {
          method: "POST",
          headers,
          body: JSON.stringify({ following_id: userId }),
        });
        
        if (response.ok) {
          setFollowing(true);
          onFollowChange?.(true);
        } else {
          console.error("Failed to follow user");
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleFollow}
      disabled={loading}
      variant={following ? "outline" : "default"}
      size="sm"
      className="min-w-[80px]"
    >
      {loading ? "..." : following ? "Following" : "Follow"}
    </Button>
  );
}
