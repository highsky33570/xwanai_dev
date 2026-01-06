import { FC } from "react";
import { Card, CardBody, Skeleton } from "@heroui/react";

interface SessionSkeletonProps {}

const SessionSkeleton: FC<SessionSkeletonProps> = ({}) => (
  <Card className="bg-content2/60">
    <CardBody className="p-4">
      <div className="flex items-start gap-3">
        {/* 头像骨架 */}
        <Skeleton className="rounded-full">
          <div className="w-10 h-10 bg-default-200"></div>
        </Skeleton>

        <div className="flex-1 space-y-2">
          {/* 标题骨架 */}
          <Skeleton className="rounded-lg">
            <div className="h-4 w-32 bg-default-200"></div>
          </Skeleton>

          {/* ID和时间骨架 */}
          <div className="space-y-1">
            <Skeleton className="rounded-lg">
              <div className="h-3 w-24 bg-default-200"></div>
            </Skeleton>
            <Skeleton className="rounded-lg">
              <div className="h-3 w-20 bg-default-200"></div>
            </Skeleton>
          </div>
        </div>

        {/* 时间骨架 */}
        <div className="text-right space-y-1">
          <Skeleton className="rounded-lg">
            <div className="h-3 w-16 bg-default-200"></div>
          </Skeleton>
          <Skeleton className="rounded-lg">
            <div className="h-3 w-12 bg-default-200"></div>
          </Skeleton>
        </div>
      </div>
    </CardBody>
  </Card>
);

export default SessionSkeleton;
