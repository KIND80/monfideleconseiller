import React from "react";
import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login({
  onLogin,
}: {
  onLogin: (role: string, userId: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Connexion Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg("Erreur de connexion : " + error.message);
      return;
    }

    const user = data.user;

    if (!user) {
      setErrorMsg("Utilisateur introuvable.");
      return;
    }

    // Récupération du rôle
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      setErrorMsg("Impossible de récupérer le rôle.");
      return;
    }

    const role = userData.role;
    onLogin(role, user.id);
  };

  return (
    <div
      style={{
        padding: 40,
        maxWidth: 400,
        margin: "auto",
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
      }}
    >
      {/* 🎉 Message de bienvenue */}
      <h1 style={{ marginBottom: 10 }}>
        👋 Bienvenue sur <strong>MyPocket</strong>
      </h1>
      <p style={{ color: "#555", marginBottom: 30 }}>
        Votre outil intelligent pour la gestion des contacts et le phoning
        efficace.
      </p>

      <h2>🔐 Connexion</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            marginBottom: 10,
            padding: 10,
            borderRadius: 4,
            border: "1px solid #ccc",
          }}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: "100%",
            marginBottom: 10,
            padding: 10,
            borderRadius: 4,
            border: "1px solid #ccc",
          }}
        />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: 12,
            backgroundColor: "#4CAF50",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Se connecter
        </button>
      </form>

      {errorMsg && <p style={{ color: "red", marginTop: 15 }}>{errorMsg}</p>}
    </div>
  );
}
