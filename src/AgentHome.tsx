import React from "react";
import { useState } from "react";
import AppelContact from "./AppelContact";
import PortefeuilleAgent from "./PortefeuilleAgent";

export default function AgentHome({ agentId }: { agentId: string }) {
  const [onglet, setOnglet] = useState<"global" | "mes_contacts">("global");

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 20 }}>
      <h1>👤 Espace Agent</h1>

      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => setOnglet("global")}
          style={{
            marginRight: 10,
            padding: 10,
            backgroundColor: onglet === "global" ? "#4CAF50" : "#eee",
            color: onglet === "global" ? "#fff" : "#000",
            border: "none",
            borderRadius: 5,
          }}
        >
          📂 Portefeuille Global
        </button>

        <button
          onClick={() => setOnglet("mes_contacts")}
          style={{
            padding: 10,
            backgroundColor: onglet === "mes_contacts" ? "#2196F3" : "#eee",
            color: onglet === "mes_contacts" ? "#fff" : "#000",
            border: "none",
            borderRadius: 5,
          }}
        >
          📁 Mes Contacts
        </button>
      </div>

      {onglet === "global" && <AppelContact agentId={agentId} />}
      {onglet === "mes_contacts" && <PortefeuilleAgent agentId={agentId} />}
    </div>
  );
}
