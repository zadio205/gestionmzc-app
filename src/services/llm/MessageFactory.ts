import { AnalysisContext } from './providers/LLMProvider';

/**
 * Factory for generating different types of messages
 */
export class MessageFactory {
  static generateJustificationTemplate(context: AnalysisContext): string {
    const { clientName, amount, date, description, reference, type } = context;
    
    if (type === 'payment') {
      return this.generatePaymentTemplate(clientName, amount, date, description, reference);
    } else {
      return this.generateInvoiceTemplate(clientName, amount, date, description, reference);
    }
  }

  private static generatePaymentTemplate(
    clientName: string,
    amount: number,
    date: string,
    description: string,
    reference?: string
  ): string {
    return `Bonjour,

Nous avons identifié un encaissement de ${amount}€ en date du ${date}.

Description: ${description}
Référence: ${reference || 'non spécifiée'}

Afin de compléter notre suivi comptable, pourriez-vous nous fournir les justificatifs suivants :
- Copie du chèque ou relevé bancaire
- Facture correspondante si applicable
- Tout autre document justificatif

Cette demande s'inscrit dans le cadre de nos obligations de contrôle et de traçabilité comptable.

Merci de votre collaboration.

Cordialement,
L'équipe comptable`;
  }

  private static generateInvoiceTemplate(
    clientName: string,
    amount: number,
    date: string,
    description: string,
    reference?: string
  ): string {
    return `Bonjour,

Nous constatons que la facture d'un montant de ${amount}€ émise le ${date} présente un solde non soldé.

Description: ${description}
Référence: ${reference || 'non spécifiée'}

Pourriez-vous nous indiquer :
- Le statut actuel de cette facture
- La date de règlement prévue
- Tout élément explicatif concernant ce dossier

Nous restons à votre disposition pour tout complément d'information.

Cordialement,
L'équipe comptable`;
  }

  static getEmergencyFallback(type: 'payment' | 'invoice'): string {
    return type === 'payment' 
      ? 'Bonjour, merci de nous fournir les justificatifs pour cet encaissement. Cordialement.'
      : 'Bonjour, merci de nous indiquer le statut de cette facture. Cordialement.';
  }
}