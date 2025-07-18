import React from 'react';
import { Card, CardContent } from '../../../../components/ui/card';
import { Skeleton } from '../../../../components/ui/skeleton';

const ProfileSkeleton: React.FC = () => {
  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <Card className="shadow-xl border-0 bg-gradient-to-br from-gray-50 to-gray-100">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <Skeleton className="w-36 h-36 rounded-full" />
            <div className="flex-1 space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-10 w-80" />
                <Skeleton className="h-5 w-60" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-40" />
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg border-0">
        <CardContent className="p-8">
          <div className="grid gap-6">
            <Skeleton className="h-8 w-60" />
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSkeleton;
