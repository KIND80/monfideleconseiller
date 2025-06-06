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
    <div className="container mx-auto px-4 py-8">
      <header className="flex flex-col items-center gap-4 mb-10">
        <h1 className="text-4xl font-bold text-zinc-800 flex items-center gap-2">
          👤 Espace Agent
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition"
        >
          🔒 Se déconnecter
        </button>
      </header>

      <nav className="flex flex-wrap justify-center gap-3 mb-10">
        <button
          onClick={() => setOnglet("global")}
          className={`px-5 py-2 rounded-full text-sm font-medium transition ${
            onglet === "global"
              ? "bg-emerald-600 text-white"
              : "bg-zinc-100 text-zinc-700 hover:bg-emerald-100"
          }`}
        >
          📂 Portefeuille Global
        </button>

        <button
          onClick={() => setOnglet("mes_contacts")}
          className={`px-5 py-2 rounded-full text-sm font-medium transition ${
            onglet === "mes_contacts"
              ? "bg-sky-600 text-white"
              : "bg-zinc-100 text-zinc-700 hover:bg-sky-100"
          }`}
        >
          📁 Mes Contacts
        </button>

        <button
          onClick={() => setOnglet("stats")}
          className={`px-5 py-2 rounded-full text-sm font-medium transition ${
            onglet === "stats"
              ? "bg-indigo-600 text-white"
              : "bg-zinc-100 text-zinc-700 hover:bg-indigo-100"
          }`}
        >
          📊 Statistiques
        </button>
      </nav>

      <main className="min-h-[200px]">
        {onglet === "global" && <AppelContact agentId={agentId} />}
        {onglet === "mes_contacts" && <PortefeuilleAgent agentId={agentId} />}
        {onglet === "stats" && (
          <section className="bg-white shadow-md p-6 rounded-xl border border-gray-100 max-w-xl mx-auto">
            <h2 className="text-2xl font-semibold text-zinc-800 flex items-center gap-2 mb-4">
              📊 Statistiques
            </h2>
            {stats ? (
              <ul className="space-y-2 text-zinc-700 text-base">
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
              <p className="text-zinc-500 italic">
                Chargement des statistiques...
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
