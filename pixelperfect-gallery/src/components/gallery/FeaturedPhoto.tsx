'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ImageOff } from 'lucide-react';
import { Photo, mockPhotos } from '@/lib/mock-photo-data';
import { getCalendarDayKey, getFeaturedPhotoFromDayKey } from '@/lib/feature-utils';

interface FeaturedPhotoProps {
  photos?: Photo[];
  date?: Date;
  className?: string;
}

export function FeaturedPhoto({ photos = mockPhotos, date, className = '' }: FeaturedPhotoProps) {
  const shouldReduceMotion = useReducedMotion();
  const dayKey = getCalendarDayKey(date ?? new Date());

  const featuredPhoto: Photo | null = useMemo((): Photo | null => {
    return getFeaturedPhotoFromDayKey(photos, dayKey);
  }, [photos, dayKey]);

  const [isImageLoading, setIsImageLoading] = useState<boolean>(true);
  const [hasImageError, setHasImageError] = useState<boolean>(false);

  useEffect(() => {
    setIsImageLoading(true);
    setHasImageError(false);
  }, [featuredPhoto?.id]);

  if (!featuredPhoto) {
    return (
      <div className={`card-base p-8 text-center ${className}`}>
        <div className="icon-container-blue mx-auto mb-4">
          <ImageOff className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No featured photo available</h3>
        <p className="text-slate-600 dark:text-slate-400">Upload photos to see a featured pick of the day.</p>
      </div>
    );
  }

  return (
    <motion.article
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.35, ease: 'easeOut' }}
      className={`card-elevated overflow-hidden ${className}`}
      aria-labelledby="featured-photo-title"
    >
      <div className="grid md:grid-cols-2 gap-0">
        <div className="relative min-h-[260px] md:min-h-[320px] bg-slate-100 dark:bg-slate-800">
          {isImageLoading && !hasImageError && (
            <div
              aria-hidden="true"
              className="absolute inset-0 animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"
            />
          )}

          {!hasImageError && (
            <Image
              src={featuredPhoto.url}
              alt={featuredPhoto.title}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 50vw"
              className={`object-cover transition-opacity duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setIsImageLoading(false)}
              onError={() => {
                setIsImageLoading(false);
                setHasImageError(true);
              }}
            />
          )}

          {hasImageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
              <p className="text-white font-medium px-4 text-center">{featuredPhoto.title}</p>
            </div>
          )}
        </div>

        <div className="p-6 md:p-8 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">Featured Photo of the Day</p>
            <h3 id="featured-photo-title" className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              {featuredPhoto.title}
            </h3>

            <div className="flex flex-wrap gap-2 mb-5">
              {featuredPhoto.tags.map((tag: string) => (
                <span key={tag} className="status-badge status-active">
                  {tag}
                </span>
              ))}
            </div>

            {featuredPhoto.photographer && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">by {featuredPhoto.photographer}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/gallery?search=${encodeURIComponent(featuredPhoto.title)}`} className="btn-primary">
              View in Gallery
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
