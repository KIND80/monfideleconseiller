import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import DashboardAdmin from "./DashboardAdmin";
import AgentHome from "./AgentHome";

export default function App() {
  const [role, setRole] = useState<"admin" | "agent" | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        console.error("Erreur session :", error.message);
        setLoading(false);
        return;
      }

      const user = session?.user;
      if (user?.id) {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userError) {
          console.error("Erreur récupération rôle :", userError.message);
        } else if (userData?.role === "admin" || userData?.role === "agent") {
          setRole(userData.role);
          setUserId(user.id);
        } else {
          console.warn("Rôle non reconnu :", userData?.role);
        }
      }

      setLoading(false);
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          setRole(null);
          setUserId("");
        }
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-700">
            ⏳ Chargement en cours...
          </h2>
          <p className="text-gray-500 mt-2">
            Veuillez patienter quelques instants.
          </p>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <Login
        onLogin={(r: string, id: string) => {
          if (r === "admin" || r === "agent") {
            setRole(r);
            setUserId(id);
          } else {
            alert("Rôle non reconnu.");
          }
        }}
      />
    );
  }

  if (role === "admin") return <DashboardAdmin />;
  if (role === "agent") return <AgentHome agentId={userId} />;

  return (
    <div className="h-screen flex flex-col items-center justify-center px-4 text-center">
      <h2 className="text-2xl font-bold text-red-600">⛔ Accès refusé</h2>
      <p className="mt-2 text-gray-600 max-w-md">
        Rôle non autorisé ou introuvable. Merci de contacter un administrateur
        si vous pensez que c’est une erreur.
      </p>
    </div>
  );
}
