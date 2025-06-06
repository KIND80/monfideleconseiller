// ✅ PortefeuilleAgent.tsx (version modernisée avec Tailwind CSS)

import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

type Contact = {
  id: string;
  nom: string;
  telephone: string;
  adresse: string;
  npa: string;
  type_assurance: string;
  categorie_contact: string;
  agent_id: string;
  rdv_date: string;
  statut: string;
};

type Appel = {
  id: string;
  contact_id: string;
  date: string;
  statut_appel: string;
  commentaire: string;
};

export default function PortefeuilleAgent({ agentId }: { agentId: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [callHistory, setCallHistory] = useState<Appel[]>([]);
  const [commentaire, setCommentaire] = useState<Record<string, string>>({});
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [editValues, setEditValues] = useState<Record<string, Partial<Contact>>>({});

  useEffect(() => {
    const fetchData = async () => {
      const { data: contactData } = await supabase
        .from("contacts")
        .select("*")
        .eq("agent_id", agentId);

      const { data: appelsData } = await supabase
        .from("call_history")
        .select("*")
        .order("date", { ascending: false });

      setContacts(contactData || []);
      setCallHistory(appelsData || []);
    };

    fetchData();
  }, [agentId]);

  const validerSignature = async (
    contactId: string,
    type: "Signature" | "Non Signature"
  ) => {
    const commentaireTexte = commentaire[contactId]?.trim();
    if (!commentaireTexte) {
      alert("Merci de saisir un commentaire avant de valider.");
      return;
    }

    await supabase
      .from("contacts")
      .update({ statut: "à_valider" })
      .eq("id", contactId);

    await supabase.from("call_history").insert({
      contact_id: contactId,
      agent_id: agentId,
      statut_appel: "Répondu",
      commentaire: commentaireTexte || type,
    });

    alert(`${type} soumise à validation.`);
    setCommentaire((prev) => ({ ...prev, [contactId]: "" }));
  };

  const handleSave = async (id: string) => {
    const updates = editValues[id];
    if (!updates) return;

    const { error } = await supabase.from("contacts").update(updates).eq("id", id);
    if (!error) {
      setEditMode((prev) => ({ ...prev, [id]: false }));
      setEditValues((prev) => ({ ...prev, [id]: {} }));
      const { data: updatedContacts } = await supabase
        .from("contacts")
        .select("*")
        .eq("agent_id", agentId);
      setContacts(updatedContacts || []);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6">📁 Mon portefeuille</h1>

      {contacts.map((c) => {
        const historique = callHistory
          .filter((h) => h.contact_id === c.id)
          .slice(0, 3);
        const editing = editMode[c.id];
        const values = editValues[c.id] || {};

        return (
          <div key={c.id} className="card fade-in">
            <h2 className="text-xl font-semibold mb-2">
              {editing ? (
                <input
                  className="border rounded px-2 py-1 w-full"
                  value={values.nom ?? c.nom}
                  onChange={(e) =>
                    setEditValues((prev) => ({
                      ...prev,
                      [c.id]: { ...prev[c.id], nom: e.target.value },
                    }))
                  }
                />
              ) : (
                c.nom
              )}
            </h2>

            {["telephone", "categorie_contact", "type_assurance", "adresse"].map(
              (field) => (
                <p key={field} className="mb-1">
                  <strong>
                    {field === "telephone" && "📞 Téléphone :"}
                    {field === "categorie_contact" && "📋 Catégorie :"}
                    {field === "type_assurance" && "🛁 Assurance :"}
                    {field === "adresse" && "🏠 Adresse :"}
                  </strong>{" "}
                  {editing ? (
                    <input
                      className="border rounded px-2 py-1 w-full"
                      value={values[field as keyof Contact] ?? c[field as keyof Contact]}
                      onChange={(e) =>
                        setEditValues((prev) => ({
                          ...prev,
                          [c.id]: {
                            ...prev[c.id],
                            [field]: e.target.value,
                          },
                        }))
                      }
                    />
                  ) : (
                    c[field as keyof Contact]
                  )}
                </p>
              )
            )}

            <div className="mt-3 flex gap-2">
              {editing ? (
                <>
                  <button className="btn" onClick={() => handleSave(c.id)}>💾 Enregistrer</button>
                  <button
                    className="btn btn-gray"
                    onClick={() => setEditMode((prev) => ({ ...prev, [c.id]: false }))}
                  >
                    ❌ Annuler
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => setEditMode((prev) => ({ ...prev, [c.id]: true }))}
                >
                  ✏️ Modifier
                </button>
              )}
            </div>

            <textarea
              placeholder="Ajouter un commentaire ici..."
              value={commentaire[c.id] || ""}
              onChange={(e) =>
                setCommentaire((prev) => ({ ...prev, [c.id]: e.target.value }))
              }
              className="w-full mt-3 p-2 border rounded"
            />

            {c.statut === "rdv" && (
              <div className="mt-4">
                <p className="mb-2 font-medium">🕓 RDV à valider :
                </p>
                <button
                  className="btn mr-2"
                  onClick={() => validerSignature(c.id, "Signature")}
                >
                  ✅ Signature
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => validerSignature(c.id, "Non Signature")}
                >
                  ❌ Non Signature
                </button>
              </div>
            )}

            {historique.length > 0 && (
              <div className="mt-4 bg-gray-100 p-3 rounded">
                <strong>🕓 3 derniers appels :</strong>
                <ul className="mt-2 list-disc list-inside">
                  {historique.map((h) => (
                    <li key={h.id}>
                      {new Date(h.date).toLocaleString()} — {h.statut_appel}
                      {h.commentaire && ` — ${h.commentaire}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
