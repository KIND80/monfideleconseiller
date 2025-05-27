import React from "react";
import { useState } from "react";
import Login from "./Login";
import DashboardAdmin from "./DashboardAdmin";
import AgentHome from "./AgentHome"; // ✅ nouveau composant agent

export default function App() {
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");

  if (!role) {
    return (
      <Login
        onLogin={(r, id) => {
          setRole(r);
          setUserId(id);
        }}
      />
    );
  }

  if (role === "admin") {
    return <DashboardAdmin />;
  }

  if (role === "agent") {
    return <AgentHome agentId={userId} />;
  }

  return <p>Rôle inconnu.</p>;
}
