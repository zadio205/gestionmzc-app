export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec navigation skeleton */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="w-32 h-6 bg-gray-300 rounded animate-pulse"></div>
              <div className="hidden md:flex space-x-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-300 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb et titre */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-1 h-4 bg-gray-200 animate-pulse"></div>
            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <div className="w-80 h-8 bg-gray-300 rounded mb-2 animate-pulse"></div>
              <div className="w-96 h-5 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="w-32 h-10 bg-blue-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Statistiques - 6 cartes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          {[
            { color: 'bg-blue-100', iconColor: 'bg-blue-300' },
            { color: 'bg-green-100', iconColor: 'bg-green-300' },
            { color: 'bg-purple-100', iconColor: 'bg-purple-300' },
            { color: 'bg-orange-100', iconColor: 'bg-orange-300' },
            { color: 'bg-indigo-100', iconColor: 'bg-indigo-300' },
            { color: 'bg-red-100', iconColor: 'bg-red-300' },
          ].map((style, i) => (
            <div key={i} className={`bg-white rounded-lg border border-gray-200 p-6 ${style.color} animate-pulse`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="w-20 h-4 bg-gray-300 rounded mb-3"></div>
                  <div className="w-12 h-8 bg-gray-400 rounded mb-2"></div>
                  <div className="w-16 h-3 bg-gray-200 rounded"></div>
                </div>
                <div className={`w-12 h-12 ${style.iconColor} rounded-lg flex items-center justify-center`}>
                  <div className="w-6 h-6 bg-white rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contenu principal en 3 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne de gauche - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Actions rapides */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="w-48 h-6 bg-gray-300 rounded mb-6 animate-pulse"></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center p-4 border border-gray-100 rounded-lg hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-gray-300 rounded-lg mb-3 animate-pulse"></div>
                    <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Outils et raccourcis */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="w-40 h-6 bg-gray-300 rounded mb-4 animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-4 border border-gray-100 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-gray-300 rounded animate-pulse"></div>
                      <div className="w-24 h-5 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                    <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Graphique ou tableau */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="w-36 h-6 bg-gray-300 rounded mb-4 animate-pulse"></div>
              <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Colonne de droite - 1/3 */}
          <div className="space-y-6">
            {/* Notifications intelligentes */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="w-40 h-6 bg-gray-300 rounded mb-4 animate-pulse"></div>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="w-full h-4 bg-gray-300 rounded mb-2 animate-pulse"></div>
                      <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fil d'activité */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="w-32 h-6 bg-gray-300 rounded mb-4 animate-pulse"></div>
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="w-full h-4 bg-gray-200 rounded mb-1 animate-pulse"></div>
                      <div className="w-1/2 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* État du système */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="w-36 h-6 bg-gray-300 rounded mb-4 animate-pulse"></div>
              <div className="space-y-3">
                {[
                  { status: 'bg-green-200' },
                  { status: 'bg-yellow-200' },
                  { status: 'bg-green-200' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
                      <div className="w-24 h-4 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                    <div className={`w-16 h-6 ${item.status} rounded animate-pulse`}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}