// ✅ Version refaite : FicheClient.tsx (Tailwind + Responsive)

import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface Props {
  contactId: string;
  userRole: "admin" | "agent";
  userName: string;
}

interface Contact {
  id: string;
  nom: string;
  telephone: string;
  adresse?: string;
  npa?: string;
  agent_id: string;
  rdv_date: string;
  statut: string;
}

interface Commentaire {
  id: string;
  auteur: string;
  contenu: string;
  date: string;
  type: string;
}

export default function FicheClient({ contactId, userRole, userName }: Props) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [commentaires, setCommentaires] = useState<Commentaire[]>([]);
  const [nouveauCommentaire, setNouveauCommentaire] = useState("");
  const [relanceDate, setRelanceDate] = useState("");

  useEffect(() => {
    const fetchContact = async () => {
      const { data } = await supabase.from("contacts").select("*").eq("id", contactId).single();
      setContact(data);
    };

    const fetchCommentaires = async () => {
      const { data } = await supabase
        .from("commentaires")
        .select("*")
        .eq("contact_id", contactId)
        .order("date", { ascending: false });
      setCommentaires(data || []);
    };

    fetchContact();
    fetchCommentaires();
  }, [contactId]);

  const ajouterCommentaire = async () => {
    if (!nouveauCommentaire.trim()) return;
    await supabase.from("commentaires").insert({
      contact_id: contactId,
      auteur: userName,
      contenu: nouveauCommentaire,
      type: "commentaire",
    });
    setNouveauCommentaire("");
    const { data } = await supabase
      .from("commentaires")
      .select("*")
      .eq("contact_id", contactId)
      .order("date", { ascending: false });
    setCommentaires(data || []);
  };

  const ajouterRelance = async () => {
    if (!relanceDate) return;
    await supabase.from("commentaires").insert({
      contact_id: contactId,
      auteur: userName,
      contenu: `Relance prévue pour le ${relanceDate}`,
      type: "relance",
    });
    setRelanceDate("");
    const { data } = await supabase
      .from("commentaires")
      .select("*")
      .eq("contact_id", contactId)
      .order("date", { ascending: false });
    setCommentaires(data || []);
  };

  const changerStatut = async (statut: "validé" | "refusé") => {
    await supabase.from("contacts").update({ statut }).eq("id", contactId);
    setContact((prev) => (prev ? { ...prev, statut } : prev));
    await supabase.from("commentaires").insert({
      contact_id: contactId,
      auteur: userName,
      contenu: `Fiche ${statut}e par ${userName}`,
      type: "action_admin",
    });
    const { data } = await supabase
      .from("commentaires")
      .select("*")
      .eq("contact_id", contactId)
      .order("date", { ascending: false });
    setCommentaires(data || []);
  };

  const badgeCouleur = (statut: string) => {
    switch (statut) {
      case "validé":
        return "bg-green-500";
      case "refusé":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  if (!contact) return <p className="text-center py-4">Chargement...</p>;

  return (
    <div className="bg-white p-4 rounded shadow max-w-2xl mx-auto">
      <h3 className="text-xl font-bold mb-2">
        {contact.nom} <span className={`text-white px-2 py-1 rounded ml-2 text-sm ${badgeCouleur(contact.statut)}`}>{contact.statut}</span>
      </h3>
      <p className="mb-1"><strong>Téléphone :</strong> {contact.telephone}</p>
      {contact.adresse && <p className="mb-2"><strong>Adresse :</strong> {contact.adresse} {contact.npa}</p>}

      <h4 className="font-semibold mt-4 mb-2">🕓 Historique</h4>
      <ul className="text-sm space-y-1">
        {commentaires.map((c) => (
          <li key={c.id} className="border-b py-1">
            [{new Date(c.date).toLocaleString()}] <strong>{c.auteur}</strong> ({c.type}) : {c.contenu}
          </li>
        ))}
      </ul>

      <h4 className="font-semibold mt-4 mb-1">💬 Ajouter un commentaire</h4>
      <textarea
        value={nouveauCommentaire}
        onChange={(e) => setNouveauCommentaire(e.target.value)}
        rows={3}
        className="w-full border rounded px-3 py-2 mb-2"
      />
      <button onClick={ajouterCommentaire} className="bg-blue-600 text-white px-4 py-2 rounded">📂 Sauvegarder</button>

      <h4 className="font-semibold mt-4 mb-1">🔕 Planifier une relance</h4>
      <div className="flex items-center gap-2 mb-2">
        <input
          type="date"
          value={relanceDate}
          onChange={(e) => setRelanceDate(e.target.value)}
          className="border px-3 py-2 rounded"
        />
        <button onClick={ajouterRelance} className="bg-indigo-600 text-white px-4 py-2 rounded">➕ Ajouter relance</button>
      </div>

      {userRole === "admin" && contact.statut === "à_valider" && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">✅ Valider ou refuser cette fiche</h4>
          <div className="flex gap-2">
            <button
              onClick={() => changerStatut("validé")}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              ✅ Valider
            </button>
            <button
              onClick={() => changerStatut("refusé")}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              ❌ Refuser
            </button>
          </div>
        </div>
      )}
    </div>
  );
}