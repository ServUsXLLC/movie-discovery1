"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import FollowButton from "./FollowButton";

interface UserCardProps {
  user: {
    id: number;
    display_name: string;
    email: string;
    avatar?: string;
    bio?: string;
    is_following: boolean;
    followers_count: number;
    following_count: number;
  };
  showFollowButton?: boolean;
  onFollowChange?: (userId: number, isFollowing: boolean) => void;
}

export default function UserCard({ user, showFollowButton = true, onFollowChange }: UserCardProps) {
  const handleFollowChange = (isFollowing: boolean) => {
    onFollowChange?.(user.id, isFollowing);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Avatar */}
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300 flex-shrink-0">
            {user.avatar ? (
              <Image 
                src={user.avatar} 
                alt={user.display_name} 
                fill 
                style={{ objectFit: "cover" }} 
              />
            ) : (
              <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                {user.display_name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/user/${user.id}`} className="hover:underline">
              <h3 className="font-semibold text-gray-900 truncate">
                {user.display_name}
              </h3>
            </Link>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
            
            {user.bio && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {user.bio}
              </p>
            )}

            {/* Follow Stats */}
            <div className="flex space-x-4 mt-2 text-sm text-gray-500">
              <span>{user.followers_count} followers</span>
              <span>{user.following_count} following</span>
            </div>
          </div>
        </div>

        {/* Follow Button */}
        {showFollowButton && (
          <div className="ml-4 flex-shrink-0">
            <FollowButton
              userId={user.id}
              isFollowing={user.is_following}
              onFollowChange={handleFollowChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
