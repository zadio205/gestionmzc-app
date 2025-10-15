'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import UnauthorizedRedirect from '@/components/auth/UnauthorizedRedirect';
import { Plus, Edit, Trash2, Eye, Calendar, User, Tag } from 'lucide-react';

const AdminNews = () => {
  const { user, loading } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data - à remplacer par de vraies données
  const news = [
    {
      id: '1',
      title: 'Nouvelles réglementations fiscales 2024',
      content: 'Les nouvelles réglementations fiscales entrent en vigueur ce mois-ci. Voici ce que vous devez savoir...',
      author: 'Admin Principal',
      status: 'published',
      category: 'Fiscal',
      publishedAt: '2024-01-15',
      views: 156,
      tags: ['fiscal', 'réglementation', '2024']
    },
    {
      id: '2',
      title: 'Mise à jour de la plateforme',
      content: 'Nous avons ajouté de nouvelles fonctionnalités pour améliorer votre expérience...',
      author: 'Admin Principal',
      status: 'published',
      category: 'Plateforme',
      publishedAt: '2024-01-12',
      views: 89,
      tags: ['plateforme', 'mise à jour']
    },
    {
      id: '3',
      title: 'Formation comptabilité avancée',
      content: 'Une nouvelle session de formation en comptabilité avancée sera organisée le mois prochain...',
      author: 'Marie Dupont',
      status: 'draft',
      category: 'Formation',
      publishedAt: null,
      views: 0,
      tags: ['formation', 'comptabilité']
    },
    {
      id: '4',
      title: 'Fermeture exceptionnelle',
      content: 'Nos bureaux seront fermés exceptionnellement le vendredi 26 janvier...',
      author: 'Admin Principal',
      status: 'scheduled',
      category: 'Annonce',
      publishedAt: '2024-01-25',
      views: 0,
      tags: ['annonce', 'fermeture']
    },
  ];

  if (!user && !loading) {
    return <UnauthorizedRedirect />;
  }

  if (user && user.role !== 'admin') {
    return <UnauthorizedRedirect />;
  }

  if (!user) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-orange-100 text-orange-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return 'Publiée';
      case 'draft': return 'Brouillon';
      case 'scheduled': return 'Programmée';
      default: return status;
    }
  };

  const filteredNews = filterStatus === 'all' 
    ? news 
    : news.filter(item => item.status === filterStatus);

  const newsCounts = {
    published: news.filter(n => n.status === 'published').length,
    draft: news.filter(n => n.status === 'draft').length,
    totalViews: news.reduce((sum, n) => sum + n.views, 0),
  };

  return (
    <DashboardLayout userRole="admin" userId={user.id}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Actualités</h1>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Publier une actualité</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900">Publiées</h3>
            <p className="text-2xl font-bold text-green-600">{newsCounts.published}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900">Brouillons</h3>
            <p className="text-2xl font-bold text-orange-600">{newsCounts.draft}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900">Vues totales</h3>
            <p className="text-2xl font-bold text-blue-600">{newsCounts.totalViews}</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center space-x-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les actualités</option>
              <option value="published">Publiées</option>
              <option value="draft">Brouillons</option>
              <option value="scheduled">Programmées</option>
            </select>
          </div>
        </div>
        
        {/* Liste des actualités */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            {filteredNews.length > 0 ? (
              <div className="space-y-6">
                {filteredNews.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                            {getStatusLabel(item.status)}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4 line-clamp-2">{item.content}</p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{item.author}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Tag className="w-4 h-4" />
                            <span>{item.category}</span>
                          </div>
                          {item.publishedAt && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(item.publishedAt).toLocaleDateString('fr-FR')}</span>
                            </div>
                          )}
                          {item.status === 'published' && (
                            <div className="flex items-center space-x-1">
                              <Eye className="w-4 h-4" />
                              <span>{item.views} vues</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {item.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Eye className="w-5 h-5" />
                        </button>
                        <button className="text-green-600 hover:text-green-800">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Aucune actualité trouvée pour ce filtre.
              </div>
            )}
          </div>
        </div>

        {/* Modal d'ajout d'actualité */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-2/3 max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Créer une nouvelle actualité</h3>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Titre</label>
                    <input
                      type="text"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Titre de l'actualité"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Catégorie</label>
                    <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                      <option>Fiscal</option>
                      <option>Plateforme</option>
                      <option>Formation</option>
                      <option>Annonce</option>
                      <option>Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contenu</label>
                    <textarea
                      rows={6}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Contenu de l'actualité"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tags (séparés par des virgules)</label>
                    <input
                      type="text"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Statut</label>
                    <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                      <option value="draft">Brouillon</option>
                      <option value="published">Publier maintenant</option>
                      <option value="scheduled">Programmer</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Créer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminNews;