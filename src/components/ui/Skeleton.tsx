import type { HTMLAttributes } from 'react'

type SkeletonProps = HTMLAttributes<HTMLDivElement>

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-800/80 ${className}`}
      {...props}
    />
  )
}

export function TextSkeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <Skeleton
      className={`h-3 w-full rounded-full bg-slate-800/90 ${className}`}
      {...props}
    />
  )
}

