'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, User, Clock, Send, Edit3, Trash2, Plus } from 'lucide-react';

interface Comment {
  id: string;
  entryId: string;
  clientId: string;
  author: string;
  authorType: 'collaborator' | 'client' | 'admin';
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  isInternal?: boolean; // Notes internes (non visibles par le client)
  priority?: 'low' | 'medium' | 'high';
  category?: 'question' | 'issue' | 'clarification' | 'approval';
}

interface CommentSystemProps {
  entryId: string;
  clientId: string;
  isClientView?: boolean; // Masque les commentaires internes si client
  onCommentAdded?: () => void;
  externalComments?: any[]; // Commentaires passés de l'extérieur
}

const CommentSystem: React.FC<CommentSystemProps> = ({
  entryId,
  clientId,
  isClientView = false,
  onCommentAdded,
  externalComments = []
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState<'question' | 'issue' | 'clarification' | 'approval'>('question');
  const [isExpanded, setIsExpanded] = useState(false);

  // Simulation de données - à remplacer par appels API
  useEffect(() => {
    // Charger les commentaires depuis l'API
    const loadComments = async () => {
      // TODO: Appel API réel
      const mockComments: Comment[] = [
        {
          id: '1',
          entryId,
          clientId,
          author: 'Jean Dupont',
          authorType: 'collaborator',
          content: 'Cette écriture nécessite une vérification des justificatifs.',
          createdAt: new Date('2024-01-15'),
          isInternal: true,
          priority: 'high',
          category: 'issue'
        }
      ];

      // Convertir les commentaires externes en format compatible
      const convertedExternalComments: Comment[] = externalComments
        .filter(comment => comment.entryId === entryId)
        .map(comment => ({
          id: comment.id,
          entryId: comment.entryId,
          clientId: clientId,
          author: comment.author || 'Utilisateur',
          authorType: 'collaborator' as const,
          content: comment.content,
          createdAt: comment.createdAt instanceof Date ? comment.createdAt : new Date(comment.createdAt),
          isInternal: false,
          priority: 'medium' as const,
          category: 'question' as const
        }));

      // Combiner les commentaires mock et externes
      const allComments = [...mockComments, ...convertedExternalComments];
      
      // Filtrer selon la vue client
      const filteredComments = isClientView 
        ? allComments.filter(c => !c.isInternal)
        : allComments;
      
      setComments(filteredComments);
    };
    
    loadComments();
  }, [entryId, clientId, isClientView, externalComments]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      entryId,
      clientId,
      author: 'Utilisateur actuel', // À récupérer du contexte auth
      authorType: isClientView ? 'client' : 'collaborator',
      content: newComment,
      createdAt: new Date(),
      isInternal,
      priority,
      category
    };

    // TODO: Sauvegarder via API
    setComments(prev => [...prev, comment]);
    setNewComment('');
    onCommentAdded?.();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'question': return '❓';
      case 'issue': return '⚠️';
      case 'clarification': return '💡';
      case 'approval': return '✅';
      default: return '💬';
    }
  };

  return (
    <div className="bg-gray-50 border-l-4 border-blue-400">
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-800">
              Commentaires ({comments.length})
            </span>
            {comments.some(c => c.priority === 'high') && (
              <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                Urgent
              </span>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            {isExpanded ? '▲ Réduire' : '▼ Voir tout'}
          </button>
        </div>

        {/* Aperçu rapide des commentaires récents (toujours visible) */}
        {!isExpanded && comments.length > 0 && (
          <div className="space-y-2 mb-3">
            {comments.slice(0, 2).map((comment) => (
              <div key={comment.id} className="bg-white p-2 rounded shadow-sm border-l-2 border-blue-200">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span className="font-medium">{comment.author}</span>
                  <span>{new Intl.DateTimeFormat('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  }).format(comment.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">
                  {comment.content.length > 100 ? `${comment.content.substring(0, 100)}...` : comment.content}
                </p>
              </div>
            ))}
            {comments.length > 2 && (
              <p className="text-xs text-gray-500 text-center">
                +{comments.length - 2} commentaire(s) supplémentaire(s)
              </p>
            )}
          </div>
        )}

        {/* Formulaire ajout rapide (toujours visible) */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Ajouter un commentaire rapide..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newComment.trim()) {
                handleAddComment();
              }
            }}
          />
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-3">
            {/* Options avancées */}
            <div className="flex items-center space-x-4 text-xs">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="px-2 py-1 border border-gray-300 rounded text-xs"
              >
                <option value="question">Question</option>
                <option value="issue">Problème</option>
                <option value="clarification">Clarification</option>
                <option value="approval">Approbation</option>
              </select>
              
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="px-2 py-1 border border-gray-300 rounded text-xs"
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>
              
              {!isClientView && (
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="w-3 h-3"
                  />
                  <span>Interne</span>
                </label>
              )}
            </div>

            {/* Liste complète des commentaires */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-white p-3 rounded-lg shadow-sm border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">
                        {comment.author}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full border ${
                        comment.authorType === 'client' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        comment.authorType === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {comment.authorType === 'client' ? 'Client' : 
                         comment.authorType === 'admin' ? 'Admin' : 'Collaborateur'}
                      </span>
                      {comment.isInternal && (
                        <span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                          Interne
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs">{getCategoryIcon(comment.category || 'question')}</span>
                      <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(comment.priority || 'medium')}`}>
                        {comment.priority}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Intl.DateTimeFormat('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }).format(comment.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSystem;
