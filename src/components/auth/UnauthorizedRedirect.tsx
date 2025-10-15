'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

type UnauthorizedRedirectProps = {
  /** Message temporaire pendant la redirection */
  message?: string;
};

const DEFAULT_MESSAGE = 'Redirection vers la page de connexion...';

const UnauthorizedRedirect = ({ message = DEFAULT_MESSAGE }: UnauthorizedRedirectProps) => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth/signin');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen text-gray-600 text-sm">
      {message}
    </div>
  );
};

export default UnauthorizedRedirect;
