'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import ProgressiveLoader from '@/components/ui/ProgressiveLoader';

interface TemplateProps {
  children: React.ReactNode;
}

const loadingSteps = [
  { id: 'auth', label: 'Vérification de l\'authentification', status: 'pending' as const, duration: 800 },
  { id: 'permissions', label: 'Chargement des permissions', status: 'pending' as const, duration: 600 },
  { id: 'data', label: 'Récupération des données', status: 'pending' as const, duration: 1000 },
  { id: 'ui', label: 'Rendu de l\'interface', status: 'pending' as const, duration: 400 },
];

export default function Template({ children }: TemplateProps) {
  const pathname = usePathname();
  
  // Déterminer le titre et sous-titre basé sur la route
  const getPageInfo = () => {
    if (pathname?.startsWith('/admin/dashboard')) {
      return {
        title: 'Chargement du tableau de bord',
        subtitle: 'Préparation de votre espace administrateur...'
      };
    }
    if (pathname?.startsWith('/admin')) {
      return {
        title: 'Chargement de l\'espace admin',
        subtitle: 'Accès aux fonctions d\'administration...'
      };
    }
    if (pathname?.startsWith('/client')) {
      return {
        title: 'Chargement de votre espace client',
        subtitle: 'Préparation de vos documents et données...'
      };
    }
    if (pathname?.startsWith('/auth')) {
      return {
        title: 'Connexion en cours',
        subtitle: 'Authentification sécurisée...'
      };
    }
    return {
      title: 'Chargement de la page',
      subtitle: 'Préparation en cours...'
    };
  };

  const { title, subtitle } = getPageInfo();

  return (
    <div className="min-h-screen">
      <Suspense 
        fallback={
          <ProgressiveLoader
            steps={loadingSteps}
            title={title}
            subtitle={subtitle}
            showSteps={!pathname?.startsWith('/auth')}
          />
        }
      >
        {children}
      </Suspense>
    </div>
  );
}