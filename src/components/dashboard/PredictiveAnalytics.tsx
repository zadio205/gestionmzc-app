"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Brain,
  Calendar,
  DollarSign,
  Users,
  BarChart3,
} from "lucide-react";
import { aiService } from "@/services/aiService";

interface Prediction {
  id: string;
  type: "revenue" | "workload" | "risk" | "opportunity";
  title: string;
  description: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  confidence: number;
  timeframe: string;
  impact: "low" | "medium" | "high";
}

interface PredictiveAnalyticsProps {
  userRole: "admin" | "collaborateur";
  data: any;
}

const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({
  userRole,
  data,
}) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "week" | "month" | "quarter"
  >("month");

  useEffect(() => {
    const loadPredictions = async () => {
      try {
        setLoading(true);

        // Simulation de prédictions IA
        await new Promise((resolve) => setTimeout(resolve, 1200));

        const mockPredictions: Prediction[] =
          userRole === "admin"
            ? [
                {
                  id: "1",
                  type: "revenue",
                  title: "Revenus prévus",
                  description:
                    "Augmentation attendue basée sur les tendances actuelles",
                  value: 15.3,
                  unit: "%",
                  trend: "up",
                  confidence: 0.87,
                  timeframe: "Prochain mois",
                  impact: "high",
                },
                {
                  id: "2",
                  type: "workload",
                  title: "Charge de travail",
                  description: "Pic d'activité prévu en fin de mois",
                  value: 35,
                  unit: "% d'augmentation",
                  trend: "up",
                  confidence: 0.92,
                  timeframe: "Dans 2 semaines",
                  impact: "medium",
                },
                {
                  id: "3",
                  type: "risk",
                  title: "Clients à risque",
                  description: "Probabilité de perte de clients",
                  value: 3,
                  unit: "clients",
                  trend: "down",
                  confidence: 0.78,
                  timeframe: "Prochain trimestre",
                  impact: "high",
                },
              ]
            : [
                {
                  id: "4",
                  type: "workload",
                  title: "Tâches à venir",
                  description: "Augmentation de la charge de travail prévue",
                  value: 12,
                  unit: "nouvelles tâches",
                  trend: "up",
                  confidence: 0.85,
                  timeframe: "Semaine prochaine",
                  impact: "medium",
                },
                {
                  id: "5",
                  type: "opportunity",
                  title: "Opportunités client",
                  description:
                    "Clients susceptibles d'accepter de nouveaux services",
                  value: 4,
                  unit: "clients",
                  trend: "up",
                  confidence: 0.73,
                  timeframe: "Ce mois",
                  impact: "medium",
                },
              ];

        setPredictions(mockPredictions);
      } catch (error) {
        console.error("Erreur chargement prédictions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPredictions();
  }, [userRole, selectedTimeframe]);

  const getPredictionIcon = (type: Prediction["type"]) => {
    switch (type) {
      case "revenue":
        return <DollarSign className="w-5 h-5 text-green-600" />;
      case "workload":
        return <BarChart3 className="w-5 h-5 text-blue-600" />;
      case "risk":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "opportunity":
        return <Target className="w-5 h-5 text-purple-600" />;
      default:
        return <TrendingUp className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTrendIcon = (trend: Prediction["trend"]) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full"></div>;
    }
  };

  const getImpactColor = (impact: Prediction["impact"]) => {
    switch (impact) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Analyse Prédictive
          </h3>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Analyse Prédictive
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
          </select>
        </div>
      </div>

      {predictions.length === 0 ? (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune prédiction disponible</p>
        </div>
      ) : (
        <div className="space-y-4">
          {predictions.map((prediction) => (
            <div
              key={prediction.id}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getPredictionIcon(prediction.type)}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {prediction.title}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {prediction.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {getTrendIcon(prediction.trend)}
                  <span className="text-lg font-semibold text-gray-900">
                    {prediction.value} {prediction.unit}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-600">
                      {prediction.timeframe}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getImpactColor(
                      prediction.impact
                    )}`}
                  >
                    Impact {prediction.impact}
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500">Confiance:</span>
                  <span
                    className={`text-xs font-medium ${getConfidenceColor(
                      prediction.confidence
                    )}`}
                  >
                    {Math.round(prediction.confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Prédictions basées sur l'analyse IA des données historiques
          </span>
          <button className="text-purple-600 hover:text-purple-800">
            Voir le rapport complet
          </button>
        </div>
      </div>
    </div>
  );
};

export default PredictiveAnalytics;
