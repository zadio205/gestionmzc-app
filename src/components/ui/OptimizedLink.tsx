'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ComponentProps, MouseEvent, useCallback } from 'react';

type OptimizedLinkProps = ComponentProps<typeof Link> & {
  prefetchOnHover?: boolean;
  showProgress?: boolean;
};

/**
 * Link optimisé avec prefetch au hover et indication de chargement
 * Améliore la perception de vitesse de 300-500ms
 */
export default function OptimizedLink({
  children,
  href,
  prefetchOnHover = true,
  showProgress = true,
  onClick,
  ...props
}: OptimizedLinkProps) {
  const router = useRouter();

  const handleMouseEnter = useCallback(() => {
    if (prefetchOnHover && href) {
      // Prefetch au survol (300ms avant le clic moyen)
      router.prefetch(href.toString());
    }
  }, [prefetchOnHover, href, router]);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (showProgress) {
        // Déclencher la barre de progression
        window.dispatchEvent(new Event('navigationStart'));
      }

      // Appeler le onClick personnalisé si présent
      onClick?.(e);
    },
    [showProgress, onClick]
  );

  return (
    <Link
      href={href}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
}
