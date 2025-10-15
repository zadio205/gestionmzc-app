import { ClientLedger } from '@/types/accounting';

/**
 * Test utilities for client ledger components
 */
export class ClientLedgerTestUtils {
  /**
   * Create mock client ledger entries for testing
   */
  static createMockEntries(count: number = 5): ClientLedger[] {
    return Array.from({ length: count }, (_, index) => ({
      _id: `test-${index + 1}`,
      date: new Date(2024, 0, index + 1),
      accountNumber: `41100${index + 1}`,
      accountName: `Client Test ${index + 1}`,
      description: `Test entry ${index + 1}`,
      debit: index % 2 === 0 ? 1000 + index * 100 : 0,
      credit: index % 2 === 1 ? 800 + index * 50 : 0,
      balance: index % 2 === 0 ? 1000 + index * 100 : -(800 + index * 50),
      reference: `REF-${index + 1}`,
      clientId: 'test-client-id',
      type: 'client' as const,
      clientName: `Client Test ${index + 1}`,
      invoiceNumber: index % 2 === 0 ? `FAC-${index + 1}` : undefined,
      createdAt: new Date(),
      isImported: index > 2, // Mark some as imported
    }));
  }

  /**
   * Create mock problematic entries for analysis testing
   */
  static createProblematicEntries(): ClientLedger[] {
    return [
      // Unsolved invoice
      {
        _id: 'unsolved-1',
        date: new Date(2024, 0, 1),
        accountNumber: '411001',
        accountName: 'Client Problématique',
        description: 'Facture non soldée',
        debit: 2000,
        credit: 0,
        balance: 2000,
        reference: 'FAC-2024-001',
        clientId: 'test-client-id',
        type: 'client' as const,
        clientName: 'Client Problématique',
        invoiceNumber: 'FAC-2024-001',
        createdAt: new Date(),
      },
      // Payment without justification
      {
        _id: 'no-justif-1',
        date: new Date(2024, 0, 15),
        accountNumber: '411001',
        accountName: 'Client Problématique',
        description: 'Divers',
        debit: 0,
        credit: 1000,
        balance: -1000,
        reference: '',
        clientId: 'test-client-id',
        type: 'client' as const,
        clientName: 'Client Problématique',
        createdAt: new Date(),
      },
      // Suspicious entry (round amount, weekend, vague description)
      {
        _id: 'suspicious-1',
        date: new Date(2024, 0, 6), // Saturday
        accountNumber: '411001',
        accountName: 'Client Suspect',
        description: 'Test',
        debit: 0,
        credit: 1000, // Round amount
        balance: -1000,
        reference: 'X',
        clientId: 'test-client-id',
        type: 'client' as const,
        clientName: 'Client Suspect',
        createdAt: new Date(),
      },
    ];
  }

  /**
   * Mock LLM service responses for testing
   */
  static mockLLMResponses = {
    justificationMessage: `Bonjour,

Nous avons identifié un encaissement nécessitant des justificatifs complémentaires.

Pourriez-vous nous fournir les documents suivants :
- Justificatif de paiement
- Facture correspondante

Merci de votre collaboration.

Cordialement,
L'équipe comptable`,

    suggestions: [
      'Améliorer la traçabilité des références',
      'Enrichir les descriptions des écritures',
      'Contrôler les montants ronds',
    ],

    analysis: {
      suspiciousLevel: 'medium' as const,
      reasons: ['Description trop courte', 'Montant rond'],
      suggestions: ['Demander justificatifs', 'Vérifier cohérence'],
    },
  };

  /**
   * Create mock import data for testing
   */
  static createMockImportData() {
    return [
      {
        index: 1,
        data: {
          Date: '2024-01-15',
          'Nom Client': 'Client Import Test',
          Description: 'Facture importée',
          Référence: 'IMP-001',
          Débit: '1500',
          Crédit: '0',
        },
        isValid: true,
      },
      {
        index: 2,
        data: {
          Date: '2024-01-20',
          'Nom Client': 'Client Import Test',
          Description: 'Règlement importé',
          Référence: 'REG-IMP-001',
          Débit: '0',
          Crédit: '1500',
        },
        isValid: true,
      },
    ];
  }
}