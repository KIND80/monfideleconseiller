import React from "react";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Types
type AgentStat = {
  id: string;
  name: string;
  email: string;
  total_appels: number;
  signatures: number;
  non_signatures: number;
  a_valider: number;
};

type Contact = {
  id: string;
  nom: string;
  telephone: string;
  adresse?: string;
  npa?: string;
  agent_id: string;
  rdv_date: string;
  statut: string;
};

type Appel = {
  id: string;
  contact_id: string;
  agent_id: string;
  date: string;
  commentaire: string | null;
};

type Agent = {
  id: string;
  name: string;
  email: string;
};

export default function DashboardAdmin() {
  const [stats, setStats] = useState<AgentStat[]>([]);
  const [contactsAValider, setContactsAValider] = useState<Contact[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [appelHistory, setAppelHistory] = useState<Appel[]>([]);
  const [activeTab, setActiveTab] = useState<"stats" | "historique">("stats");

  useEffect(() => {
    const fetchData = async () => {
      const { data: users, error: userError } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("role", "agent");

      const { data: calls, error: callError } = await supabase
        .from("call_history")
        .select("*")
        .order("date", { ascending: false });

      const { data: contacts, error: contactError } = await supabase
        .from("contacts")
        .select("*");

      if (
        !users ||
        !calls ||
        !contacts ||
        userError ||
        callError ||
        contactError
      ) {
        console.error("Erreur lors du chargement des données.");
        return;
      }

      const finalStats: AgentStat[] = users.map((agent) => {
        const appels = calls.filter((c) => c.agent_id === agent.id);
        const total_appels = appels.length;
        const signatures = appels.filter((a) =>
          (a.commentaire || "").toLowerCase().includes("signature")
        ).length;
        const non_signatures = appels.filter((a) =>
          (a.commentaire || "").toLowerCase().includes("non signature")
        ).length;
        const a_valider = contacts.filter(
          (c) => c.agent_id === agent.id && c.statut === "à_valider"
        ).length;

        return {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          total_appels,
          signatures,
          non_signatures,
          a_valider,
        };
      });

      setStats(finalStats);
      setAgents(users);
      setAppelHistory(calls);
    };

    const fetchContactsAValider = async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("statut", "à_valider");

      if (!error && data) {
        setContactsAValider(data);
      }
    };

    fetchData();
    fetchContactsAValider();
  }, []);

  const validerContact = async (id: string) => {
    await supabase
      .from("contacts")
      .update({
        statut: "non_assigné",
        agent_id: null,
        rdv_date: null,
        visible_globally: true,
      })
      .eq("id", id);

    setContactsAValider((prev) => prev.filter((c) => c.id !== id));
  };

  const archiverContact = async (id: string) => {
    await supabase
      .from("contacts")
      .update({
        statut: "archivé",
        visible_globally: false,
      })
      .eq("id", id);

    setContactsAValider((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "Arial",
        maxWidth: 1000,
        margin: "auto",
      }}
    >
      <h1>👑 Tableau de bord Admin</h1>

      {/* Onglets */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab("stats")}
          style={tabStyle(activeTab === "stats", "#4CAF50")}
        >
          📊 Statistiques & validations
        </button>
        <button
          onClick={() => setActiveTab("historique")}
          style={tabStyle(activeTab === "historique", "#2196F3")}
        >
          📄 Historique par agent
        </button>
      </div>

      {/* STATISTIQUES */}
      {activeTab === "stats" && (
        <>
          <h2>📊 Statistiques des agents</h2>
          <table
            style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}
          >
            <thead>
              <tr>
                <th style={cellStyle}>Nom</th>
                <th style={cellStyle}>Email</th>
                <th style={cellStyle}>Appels</th>
                <th style={cellStyle}>Signatures</th>
                <th style={cellStyle}>Non signatures</th>
                <th style={cellStyle}>À valider</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((agent) => (
                <tr key={agent.id}>
                  <td style={cellStyle}>{agent.name}</td>
                  <td style={cellStyle}>{agent.email}</td>
                  <td style={cellStyle}>{agent.total_appels}</td>
                  <td style={cellStyle}>{agent.signatures}</td>
                  <td style={cellStyle}>{agent.non_signatures}</td>
                  <td style={cellStyle}>{agent.a_valider}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 style={{ marginTop: 40, color: "#444" }}>
            📌 Contacts en attente de validation
          </h2>
          {contactsAValider.length === 0 ? (
            <p>Aucun contact à valider.</p>
          ) : (
            <ul style={{ listStyle: "none", paddingLeft: 0 }}>
              {contactsAValider.map((c) => (
                <li
                  key={c.id}
                  style={{
                    border: "1px solid #ccc",
                    padding: 10,
                    marginBottom: 10,
                    borderRadius: 6,
                    backgroundColor: "#fff",
                  }}
                >
                  <strong>{c.nom}</strong> — 📞 {c.telephone}
                  <br />
                  🏠 {c.adresse || "—"} {c.npa || ""}
                  <br />
                  📅 RDV :{" "}
                  {c.rdv_date
                    ? new Date(c.rdv_date).toLocaleDateString("fr-FR")
                    : "Non défini"}
                  <div style={{ marginTop: 8 }}>
                    <button
                      onClick={() => validerContact(c.id)}
                      style={actionBtnStyle("#4CAF50")}
                    >
                      ✅ Valider
                    </button>
                    <button
                      onClick={() => archiverContact(c.id)}
                      style={actionBtnStyle("#f44336")}
                    >
                      ❌ Refuser
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* HISTORIQUE */}
      {activeTab === "historique" && (
        <div>
          <h2>📄 Historique des validations par agent</h2>
          {agents.map((agent) => {
            const historiques = appelHistory.filter(
              (a) =>
                a.agent_id === agent.id &&
                (a.commentaire || "").toLowerCase().includes("signature")
            );

            if (historiques.length === 0) return null;

            return (
              <div
                key={agent.id}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: 6,
                  padding: 15,
                  marginBottom: 20,
                  backgroundColor: "#f9f9f9",
                }}
              >
                <h3>👤 {agent.name}</h3>
                <ul>
                  {historiques.map((h) => (
                    <li key={h.id}>
                      📅 {new Date(h.date).toLocaleString("fr-FR")} — 🗣️{" "}
                      <strong>{h.commentaire}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Styles
const cellStyle: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: "8px",
  textAlign: "left",
};

const tabStyle = (isActive: boolean, color: string): React.CSSProperties => ({
  marginRight: 10,
  padding: 10,
  backgroundColor: isActive ? color : "#eee",
  color: isActive ? "#fff" : "#000",
  border: "none",
  borderRadius: 5,
});

const actionBtnStyle = (bg: string): React.CSSProperties => ({
  marginRight: 10,
  backgroundColor: bg,
  color: "#fff",
  border: "none",
  padding: "6px 12px",
  borderRadius: 4,
});
