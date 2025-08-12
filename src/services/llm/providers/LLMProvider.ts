/**
 * Abstract base class for LLM providers
 */
export interface AnalysisContext {
  clientName: string;
  amount: number;
  date: string;
  description: string;
  reference?: string;
  type: 'payment' | 'invoice';
}

export interface AnalysisResult {
  suspiciousLevel: 'low' | 'medium' | 'high';
  reasons: string[];
  suggestions: string[];
}

export abstract class LLMProvider {
  abstract isAvailable(): Promise<boolean>;
  abstract generateJustificationMessage(context: AnalysisContext): Promise<string>;
  abstract analyzeDescription(description: string, amount: number): Promise<AnalysisResult>;
  abstract generateSuggestions(entries: any[]): Promise<string[]>;
  
  protected formatMessage(response: string): string {
    let message = response.replace(/^Message\s*:\s*/i, '').trim();
    message = message.replace(/```/g, '');
    message = message.replace(/^\s*-\s*/gm, '');
    
    if (!message.includes('Cordialement') && !message.includes('Salutations')) {
      message += '\n\nCordialement,\nL\'équipe comptable';
    }
    
    return message;
  }
}