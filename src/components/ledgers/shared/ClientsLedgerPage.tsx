"use client";

import React from "react";
import { ClientsLedgerContainer } from "./ClientsLedgerContainer";
import { InputValidator } from "@/utils/inputValidation";

interface ClientsLedgerPageProps {
  clientId: string;
}

const ClientsLedgerPage: React.FC<ClientsLedgerPageProps> = ({ clientId }) => {
  // Validate clientId early
  try {
    const validatedClientId = InputValidator.validateClientIdStrict(clientId);
    return <ClientsLedgerContainer clientId={validatedClientId} />;
  } catch (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">Erreur de configuration</p>
          <p className="text-sm">
            {error instanceof Error ? error.message : 'Identifiant client invalide'}
          </p>
        </div>
      </div>
    );
  }
};

export default ClientsLedgerPage;
