/**
 * Modal de création d'utilisateur
 * Formulaire pour créer un nouvel utilisateur avec validation
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CreateUserInput, UserRole } from '@/types/auth';
import { logger } from '@/utils/logger';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: CreateUserInput) => Promise<void>;
  creatorRole: UserRole;
  availableRoles?: UserRole[];
}

export function CreateUserModal({
  isOpen,
  onClose,
  onCreate,
  creatorRole,
  availableRoles,
}: CreateUserModalProps) {
  const roleOptions = useMemo<UserRole[]>(() => {
    if (availableRoles && availableRoles.length > 0) {
      return availableRoles;
    }
    if (creatorRole === 'superadmin') {
      return ['admin', 'collaborateur', 'client', 'superadmin'];
    }
    return ['collaborateur', 'client'];
  }, [availableRoles, creatorRole]);

  const [formData, setFormData] = useState<CreateUserInput>({
    email: '',
    password: '',
    full_name: '',
    role: roleOptions[0] || 'client',
    client_id: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      role: roleOptions.includes(prev.role) ? prev.role : roleOptions[0] || prev.role,
    }));
  }, [roleOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.password || !formData.full_name) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.password.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      await onCreate(formData);
      // Réinitialiser le formulaire
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: roleOptions[0] || 'client',
        client_id: '',
      });
    } catch (error) {
      logger.error('Error creating user', {}, error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Créer un utilisateur
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="utilisateur@example.com"
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Mot de passe *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Minimum 6 caractères"
            />
          </div>

          {/* Nom complet */}
          <div>
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nom complet *
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Jean Dupont"
            />
          </div>

          {/* Rôle */}
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Rôle *
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role === 'superadmin' && 'Super Admin'}
                  {role === 'admin' && 'Admin'}
                  {role === 'collaborateur' && 'Collaborateur'}
                  {role === 'client' && 'Client'}
                </option>
              ))}
            </select>
          </div>

          {/* Client ID (optionnel) */}
          {formData.role === 'client' && (
            <div>
              <label
                htmlFor="client_id"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                ID Client (optionnel)
              </label>
              <input
                type="text"
                id="client_id"
                name="client_id"
                value={formData.client_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="CLTXXX"
              />
              <p className="text-xs text-gray-500 mt-1">
                Laisser vide pour générer automatiquement
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
