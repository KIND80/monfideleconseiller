// ✅ Version refaite : AgentHome.tsx (Tailwind + Responsive + UI/UX améliorée)

import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import AppelContact from "./AppelContact";
import PortefeuilleAgent from "./PortefeuilleAgent";

interface AgentStat {
  total_appels: number;
  signatures: number;
  non_signatures: number;
}

type AgentHomeProps = {
  agentId: string;
};

export default function AgentHome({ agentId }: AgentHomeProps) {
  const [onglet, setOnglet] = useState<"global" | "mes_contacts" | "stats">(
    "global"
  );
  const [stats, setStats] = useState<AgentStat | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const { data, error } = await supabase.rpc("get_agent_stats", {
        agent_id_input: agentId,
      });
      if (error) console.error("Erreur récupération stats:", error.message);
      else setStats(data);
    };
    fetchStats();
  }, [agentId]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Erreur lors de la déconnexion : " + error.message);
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-4">
          👤 Espace Agent
        </h1>
        <button
          onClick={handleLogout}
          className="bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold px-5 py-2 rounded-lg shadow hover:scale-105 transition-transform"
        >
          🔒 Se déconnecter
        </button>
      </header>

      <nav className="flex flex-wrap justify-center gap-4 mb-10">
        <button
          onClick={() => setOnglet("global")}
          className={`px-5 py-2 rounded-full font-semibold shadow ${
            onglet === "global"
              ? "bg-emerald-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-emerald-100"
          }`}
        >
          📂 Portefeuille Global
        </button>

        <button
          onClick={() => setOnglet("mes_contacts")}
          className={`px-5 py-2 rounded-full font-semibold shadow ${
            onglet === "mes_contacts"
              ? "bg-sky-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-sky-100"
          }`}
        >
          📁 Mes Contacts
        </button>

        <button
          onClick={() => setOnglet("stats")}
          className={`px-5 py-2 rounded-full font-semibold shadow ${
            onglet === "stats"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-indigo-100"
          }`}
        >
          📊 Statistiques
        </button>
      </nav>

      <main>
        {onglet === "global" && <AppelContact agentId={agentId} />}
        {onglet === "mes_contacts" && <PortefeuilleAgent agentId={agentId} />}
        {onglet === "stats" && (
          <div className="bg-white shadow-xl p-6 rounded-xl border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              📊 Statistiques
            </h2>
            {stats ? (
              <ul className="space-y-2 text-gray-700">
                <li>
                  Total d'appels :{" "}
                  <span className="font-bold text-emerald-700">
                    {stats.total_appels}
                  </span>
                </li>
                <li>
                  Signatures :{" "}
                  <span className="font-bold text-sky-700">
                    {stats.signatures}
                  </span>
                </li>
                <li>
                  Non signatures :{" "}
                  <span className="font-bold text-red-700">
                    {stats.non_signatures}
                  </span>
                </li>
              </ul>
            ) : (
              <p className="text-gray-500 italic">
                Chargement des statistiques...
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
