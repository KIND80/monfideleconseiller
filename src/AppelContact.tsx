// ⚡ Version refaite en Tailwind CSS de AppelContact.tsx
// Toutes les fonctionnalités conservées, avec UI responsive

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

// Types
interface Contact {
  id: string;
  nom: string;
  telephone: string;
  adresse: string;
  npa: string;
  categorie_contact: string;
  type_assurance: string;
  canton: string;
}

interface Appel {
  id: string;
  date: string;
  statut_appel: string;
  commentaire: string;
  agents?: {
    nom: string;
  };
}

interface AppelContactProps {
  agentId: string;
}

export default function AppelContact({ agentId }: AppelContactProps) {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filtered, setFiltered] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [categorie, setCategorie] = useState("");
  const [current, setCurrent] = useState<Contact | null>(null);
  const [etatAppel, setEtatAppel] = useState<"init" | "en_cours" | "oui">(
    "init"
  );
  const [historique, setHistorique] = useState<Appel[]>([]);
  const [commentaire, setCommentaire] = useState("");
  const [edition, setEdition] = useState(false);
  const [form, setForm] = useState<Partial<Contact>>({});

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("statut", "non_assigné")
        .eq("visible_globally", true);

      console.log("Data contacts:", data);
      console.log("Erreur éventuelle :", error);

      setContacts(data || []);
      setFiltered(data || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    let filtres = [...contacts];
    if (search) {
      filtres = filtres.filter((c) =>
        c.telephone.replace(/\s/g, "").includes(search.replace(/\s/g, ""))
      );
    }
    if (categorie) {
      filtres = filtres.filter((c) => c.categorie_contact === categorie);
    }
    setFiltered(filtres);
    if (!search && filtres.length > 0) {
      const rand = filtres[Math.floor(Math.random() * filtres.length)];
      setCurrent(rand);
      setForm(rand);
    }
  }, [search, categorie, contacts]);

  useEffect(() => {
    const fetchHistorique = async () => {
      if (!current) return;
      const { data } = await supabase
        .from("call_history")
        .select("id, date, statut_appel, commentaire, agents:agent_id(nom)")
        .eq("contact_id", current.id)
        .order("date", { ascending: false })
        .limit(3);

      setHistorique(
        (data || []).map((appel: any) => ({
          ...appel,
          agents: Array.isArray(appel.agents) ? appel.agents[0] : appel.agents,
        }))
      );
    };
    fetchHistorique();
  }, [current]);

  const enregistrerAppel = async (
    statut: "signature" | "non_signature",
    commentaireFinal: string
  ) => {
    if (!current) return;
    await supabase.from("call_history").insert({
      contact_id: current.id,
      agent_id: agentId,
      statut_appel: statut,
      commentaire: commentaireFinal,
    });
  };

  const nextContact = () => {
    const restants = filtered.filter((c) => c.id !== current?.id);
    const suivant =
      restants[Math.floor(Math.random() * restants.length)] || null;
    setCurrent(suivant);
    setForm(suivant || {});
    setEtatAppel("init");
    setCommentaire("");
    setEdition(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleInjoignable = async () => {
    await enregistrerAppel("non_signature", "Injoignable");
    nextContact();
  };

  const handleRdv = async () => {
    if (!current || !commentaire.trim()) return;
    await enregistrerAppel("signature", commentaire.trim());
    await supabase
      .from("contacts")
      .update({ agent_id: agentId, statut: "rdv", visible_globally: false })
      .eq("id", current.id);
    window.open(
      `https://calendar.google.com/calendar/u/0/r/eventedit?text=RDV+${current.nom}&details=Tel:+${current.telephone}`,
      "_blank"
    );
    nextContact();
  };

  const handleValiderCommentaire = async () => {
    if (!current || !commentaire.trim()) return;
    await enregistrerAppel("signature", commentaire.trim());
    nextContact();
  };

  const handleUpdateContact = async () => {
    if (!current || !form.nom) return;
    await supabase.from("contacts").update(form).eq("id", current.id);
    setCurrent({ ...current, ...form } as Contact);
    setEdition(false);
  };

  if (!current) {
    return (
      <p className="text-center py-10">📬 Aucun contact pour le moment.</p>
    );
  }

  const avatarUrl = `https://avatars.dicebear.com/api/initials/${encodeURIComponent(
    current.nom || "Contact"
  )}.svg`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">📂 Portefeuille Global</h2>
        <button
          onClick={handleLogout}
          className="bg-gray-600 text-white px-4 py-2 rounded"
        >
          🔓 Déconnexion
        </button>
      </div>

      {/* Filtres */}
      <div className="grid gap-4 mb-4 sm:grid-cols-2">
        <input
          type="text"
          placeholder="🔍 Rechercher numéro"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <select
          value={categorie}
          onChange={(e) => setCategorie(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="">Catégorie</option>
          <option value="phoning">Phoning</option>
          <option value="subside">Subside</option>
        </select>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        {filtered.length} contact(s) disponibles
      </p>

      {/* Carte de contact */}
      <div className="bg-white p-6 rounded shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <img
              src={avatarUrl}
              alt="avatar"
              className="w-14 h-14 rounded-full mr-4"
            />
            <div>
              {edition ? (
                <input
                  value={form.nom || ""}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="border px-2 py-1 rounded w-36"
                />
              ) : (
                <>
                  <h3 className="text-lg font-semibold">{current.nom}</h3>
                  <p className="text-sm text-gray-600">{current.telephone}</p>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => setEdition(!edition)}
            className="text-sm bg-gray-300 px-2 py-1 rounded"
          >
            ✏️
          </button>
        </div>

        {edition ? (
          <div className="space-y-2">
            {["telephone", "adresse", "npa", "canton", "type_assurance"].map(
              (field) => (
                <input
                  key={field}
                  placeholder={field}
                  value={(form as any)[field] || ""}
                  onChange={(e) =>
                    setForm({ ...form, [field]: e.target.value })
                  }
                  className="border px-3 py-2 w-full rounded"
                />
              )
            )}
            <button
              onClick={handleUpdateContact}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              ✅ Sauvegarder
            </button>
          </div>
        ) : (
          <div className="space-y-1 text-sm text-gray-700">
            <p>
              <strong>📍 Adresse :</strong> {current.adresse}, {current.npa}
            </p>
            <p>
              <strong>🏷️ Catégorie :</strong> {current.categorie_contact}
            </p>
            <p>
              <strong>🌍 Canton :</strong> {current.canton}
            </p>
            <p>
              <strong>🛡️ Assurance :</strong> {current.type_assurance || "—"}
            </p>
          </div>
        )}

        {etatAppel === "init" && (
          <div className="mt-4 space-x-2">
            <a href={`tel:${current.telephone}`}>
              <button
                onClick={() => setEtatAppel("en_cours")}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                📞 Appeler
              </button>
            </a>
            <button
              onClick={nextContact}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              ⏭️ Passer
            </button>
          </div>
        )}

        {etatAppel === "en_cours" && (
          <div className="mt-4 space-x-2">
            <button
              onClick={handleInjoignable}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              ❌ Injoignable
            </button>
            <button
              onClick={() => setEtatAppel("oui")}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              ✅ Oui
            </button>
          </div>
        )}

        {etatAppel === "oui" && (
          <div className="mt-4">
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="📝 Ajouter un commentaire"
              className="w-full border rounded px-3 py-2 mb-2 h-24"
            ></textarea>
            <div className="space-x-2">
              <button
                onClick={handleRdv}
                disabled={!commentaire.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                📅 RDV
              </button>
              <button
                onClick={handleValiderCommentaire}
                disabled={!commentaire.trim()}
                className="bg-gray-500 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                📝 Valider
              </button>
            </div>
          </div>
        )}

        {historique.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold mb-2">📞 Derniers appels</h4>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              {historique.map((appel) => (
                <li key={appel.id}>
                  📅{" "}
                  {new Date(appel.date).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  — 👤 {appel.agents?.nom || "—"} — {appel.statut_appel}
                  <br />
                  📝 {appel.commentaire}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}