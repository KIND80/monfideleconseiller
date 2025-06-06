// ✅ Version refaite : DashboardAdmin.tsx (Tailwind + Responsive + Moderne)

import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import FicheClient from "./FicheClient";

interface AgentStat {
  id: string;
  name: string;
  email: string;
  total_appels: number;
  signatures: number;
  non_signatures: number;
  a_valider: number;
}

interface Contact {
  id: string;
  nom: string;
  telephone: string;
  agent_id: string;
  rdv_date: string;
  statut: string;
}

interface Appel {
  id: string;
  contact_id: string;
  agent_id: string;
  date: string;
  commentaire: string | null;
}

interface Agent {
  id: string;
  name: string;
  email: string;
}

export default function DashboardAdmin() {
  const [stats, setStats] = useState<AgentStat[]>([]);
  const [contactsAValider, setContactsAValider] = useState<Contact[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [appelHistory, setAppelHistory] = useState<Appel[]>([]);
  const [activeTab, setActiveTab] = useState<"stats" | "historique" | "agents">(
    "stats"
  );
  const [ficheActiveId, setFicheActiveId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: users } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("role", "agent");
      const { data: calls } = await supabase
        .from("call_history")
        .select("*")
        .order("date", { ascending: false });
      const { data: contacts } = await supabase.from("contacts").select("*");
      if (!users || !calls || !contacts) return;
      const finalStats = users.map((agent) => {
        const appels = calls.filter((c) => c.agent_id === agent.id);
        return {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          total_appels: appels.length,
          signatures: appels.filter((a) =>
            (a.commentaire || "").toLowerCase().includes("signature")
          ).length,
          non_signatures: appels.filter((a) =>
            (a.commentaire || "").toLowerCase().includes("non signature")
          ).length,
          a_valider: contacts.filter(
            (c) => c.agent_id === agent.id && c.statut === "à_valider"
          ).length,
        };
      });
      setStats(finalStats);
      setAgents(users);
      setAppelHistory(calls);
    };

    const fetchContactsAValider = async () => {
      const { data } = await supabase
        .from("contacts")
        .select("*")
        .eq("statut", "à_valider");
      if (data) setContactsAValider(data);
    };

    fetchData();
    fetchContactsAValider();
  }, []);

  const supprimerAgent = async (id: string) => {
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) alert("Erreur suppression : " + error.message);
    else setAgents((prev) => prev.filter((a) => a.id !== id));
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) alert("Erreur lors de la déconnexion : " + error.message);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="flex flex-wrap justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">👑 Tableau de bord Admin</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          🔒 Déconnexion
        </button>
      </header>

      <div className="mb-6 flex gap-3 flex-wrap">
        <button
          onClick={() => setActiveTab("stats")}
          className={`px-4 py-2 rounded ${
            activeTab === "stats" ? "bg-green-600 text-white" : "bg-gray-200"
          }`}
        >
          📊 Statistiques
        </button>
        <button
          onClick={() => setActiveTab("historique")}
          className={`px-4 py-2 rounded ${
            activeTab === "historique"
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
          }`}
        >
          📄 Historique
        </button>
        <button
          onClick={() => setActiveTab("agents")}
          className={`px-4 py-2 rounded ${
            activeTab === "agents" ? "bg-purple-600 text-white" : "bg-gray-200"
          }`}
        >
          👥 Agents
        </button>
      </div>

      {ficheActiveId && (
        <div className="border border-gray-300 rounded p-4 mb-4">
          <FicheClient
            contactId={ficheActiveId}
            userRole="admin"
            userName="ADMIN"
          />
          <button
            onClick={() => setFicheActiveId(null)}
            className="mt-2 text-sm text-red-600"
          >
            ❌ Fermer la fiche
          </button>
        </div>
      )}

      {activeTab === "stats" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            📊 Statistiques par agent
          </h2>
          <div className="overflow-auto">
            <table className="w-full table-auto border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-3 py-2">Nom</th>
                  <th className="border px-3 py-2">Email</th>
                  <th className="border px-3 py-2">Appels</th>
                  <th className="border px-3 py-2">Signatures</th>
                  <th className="border px-3 py-2">Non Signatures</th>
                  <th className="border px-3 py-2">À valider</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.id} className="text-center">
                    <td className="border px-3 py-2">{s.name}</td>
                    <td className="border px-3 py-2">{s.email}</td>
                    <td className="border px-3 py-2">{s.total_appels}</td>
                    <td className="border px-3 py-2">{s.signatures}</td>
                    <td className="border px-3 py-2">{s.non_signatures}</td>
                    <td className="border px-3 py-2">{s.a_valider}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-2">
            📝 Fiches à valider
          </h2>
          <table className="w-full table-auto border-collapse text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2">Nom</th>
                <th className="border px-3 py-2">Téléphone</th>
                <th className="border px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contactsAValider.map((c) => (
                <tr key={c.id} className="text-center">
                  <td className="border px-3 py-2">{c.nom}</td>
                  <td className="border px-3 py-2">{c.telephone}</td>
                  <td className="border px-3 py-2">
                    <button
                      onClick={() => setFicheActiveId(c.id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                    >
                      📝 Consulter
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "historique" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            📄 Historique des appels
          </h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {appelHistory.map((a) => (
              <li key={a.id}>
                {a.date} — {a.commentaire}
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === "agents" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">👥 Gestion des agents</h2>
          <p className="text-gray-500">
            La création des comptes agents se fait désormais manuellement depuis
            Supabase.
          </p>
          <table className="w-full table-auto border-collapse text-sm mt-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2">Nom</th>
                <th className="border px-3 py-2">Email</th>
                <th className="border px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id} className="text-center">
                  <td className="border px-3 py-2">{a.name}</td>
                  <td className="border px-3 py-2">{a.email}</td>
                  <td className="border px-3 py-2">
                    <button
                      onClick={() => supprimerAgent(a.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      🗑️ Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
