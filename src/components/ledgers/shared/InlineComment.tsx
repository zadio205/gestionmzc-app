'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, User, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { listComments, addComment } from '@/services/commentsService';
import type { LedgerComment } from '@/types/comments';

interface CommentUI {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
}

interface InlineCommentProps {
  entryId: string;
  clientId: string;
  showInTable?: boolean; // Affichage ultra-compact dans le tableau
}

const InlineComment: React.FC<InlineCommentProps> = ({
  entryId,
  clientId,
  showInTable = false
}) => {
  const [comments, setComments] = useState<CommentUI[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Charger les commentaires réels depuis Supabase
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const rows = await listComments(clientId, entryId, 'supplier');
        if (!mounted) return;
        const mapped: CommentUI[] = rows.map((r) => ({
          id: r.id,
          author: r.author || 'Utilisateur',
          content: r.content,
          createdAt: r.createdAt,
          priority: r.priority || 'medium',
        }));
        setComments(mapped);
      } catch (e) {
        // ignore et laisser vide
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [clientId, entryId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const optimistic: CommentUI = {
      id: `tmp-${Date.now()}`,
      author: 'Moi',
      content: newComment,
      createdAt: new Date(),
      priority: 'medium',
    };
    setComments(prev => [...prev, optimistic]);
    const toSend = newComment;
    setNewComment('');
    setShowForm(false);

    try {
      const created = await addComment({
        clientId,
        entryId,
        ledgerType: 'supplier',
        content: toSend,
        author: 'Moi',
        authorType: 'collaborateur',
        priority: 'medium',
        isInternal: false,
      });
      if (created) {
        setComments(prev => prev.map(c => c.id === optimistic.id ? {
          id: created.id,
          author: created.author || 'Utilisateur',
          content: created.content,
          createdAt: created.createdAt,
          priority: created.priority || 'medium',
        } : c));
      }
    } catch (e) {
      // Échec: retirer l'optimiste
      setComments(prev => prev.filter(c => c.id !== optimistic.id));
    }
  };

  // Affichage ultra-compact pour le tableau
  if (showInTable) {
    return (
      <div className="flex items-center space-x-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-1 rounded-full ${
            comments.length > 0 
              ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
          title={`${comments.length} commentaire(s)`}
        >
          <MessageCircle className="w-3 h-3" />
          {comments.length > 0 && (
            <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
              {comments.length}
            </span>
          )}
        </button>
        
        {isExpanded && (
          <div className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-80 top-full right-0">
            <div className="space-y-2 max-h-32 overflow-y-auto mb-2">
              {comments.map((comment) => (
                <div key={comment.id} className="text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span className="font-medium">{comment.author}</span>
                    <span>{new Intl.DateTimeFormat('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }).format(comment.createdAt)}</span>
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              ))}
            </div>
            <div className="flex space-x-1">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Réponse rapide..."
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Affichage intégré sous les lignes
  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            {comments.length} commentaire{comments.length > 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showForm ? 'Annuler' : '+ Ajouter'}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Aperçu rapide */}
      {!isExpanded && comments.length > 0 && (
        <div className="bg-white p-2 rounded border-l-2 border-blue-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-medium">{comments[comments.length - 1].author}</span>
            <span>{new Intl.DateTimeFormat('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }).format(comments[comments.length - 1].createdAt)}</span>
          </div>
          <p className="text-sm text-gray-700 mt-1">
            {comments[comments.length - 1].content.length > 60 
              ? `${comments[comments.length - 1].content.substring(0, 60)}...`
              : comments[comments.length - 1].content
            }
          </p>
        </div>
      )}

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="mt-2 bg-white p-2 rounded border">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Votre commentaire..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              autoFocus
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Liste complète des commentaires */}
      {isExpanded && (
        <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white p-2 rounded border">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span className="font-medium">{comment.author}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Intl.DateTimeFormat('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  }).format(comment.createdAt)}</span>
                </div>
              </div>
              <p className="text-sm text-gray-700">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InlineComment;
