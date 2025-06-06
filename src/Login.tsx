import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login({
  onLogin,
}: {
  onLogin: (role: string, userId: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMsg("❌ " + error.message);
      setLoading(false);
      return;
    }

    const user = data.user;
    if (!user) {
      setErrorMsg("❌ Utilisateur introuvable.");
      setLoading(false);
      return;
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      setErrorMsg("❌ Impossible de récupérer le rôle.");
      setLoading(false);
      return;
    }

    setLoading(false);
    onLogin(userData.role, user.id);
  };

  const handlePasswordReset = async () => {
    setErrorMsg("");
    setResetSent(false);
    if (!email) {
      setErrorMsg("Veuillez entrer votre email.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setErrorMsg("Erreur d'envoi : " + error.message);
    } else {
      setResetSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-green-100 to-green-300">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-2 text-green-700">
          👋 Bienvenue sur <span className="text-black dark:text-white">My Pocket</span>
        </h1>
        <p className="text-sm text-center text-gray-500 mb-6">
          Votre outil intelligent pour la gestion des contacts.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            aria-label="Adresse email"
            placeholder="Email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white"
          />
          <input
            type="password"
            aria-label="Mot de passe"
            placeholder="Mot de passe"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white"
          />
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-semibold flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading && (
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
                ></path>
              </svg>
            )}
            {loading ? "Connexion en cours..." : "🔐 Se connecter"}
          </button>
        </form>

        <button
          onClick={handlePasswordReset}
          className="w-full mt-3 text-sm text-blue-600 hover:underline"
        >
          🔁 Réinitialiser mot de passe
        </button>

        {errorMsg && (
          <p className="mt-4 text-sm text-red-600 text-center">{errorMsg}</p>
        )}
        {resetSent && (
          <p className="mt-4 text-sm text-green-600 text-center">
            📩 Lien de réinitialisation envoyé.
          </p>
        )}

        <button
          onClick={() => document.body.classList.toggle("dark-mode")}
          className="w-full mt-6 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-300"
        >
          🌗 Activer/désactiver le mode sombre
        </button>
      </div>
    </div>
  );
}
