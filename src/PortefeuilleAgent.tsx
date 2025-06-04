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

  return (
    <div className="container">
      <h1 className="text-center">📁 Mon portefeuille</h1>

      {contacts.map((c) => {
        const historique = callHistory
          .filter((h) => h.contact_id === c.id)
          .slice(0, 3);

        return (
          <div
            key={c.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 15,
              marginBottom: 20,
              backgroundColor: "#fff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            }}
          >
            <h2>{c.nom}</h2>
            <p>
              <strong>📞 Téléphone :</strong> {c.telephone}
            </p>
            <p>
              <strong>📋 Catégorie :</strong> {c.categorie_contact || "—"}
            </p>
            <p>
              <strong>🛡️ Assurance :</strong> {c.type_assurance || "—"}
            </p>
            <p>
              <strong>🏠 Adresse :</strong> {c.adresse} {c.npa}
            </p>
            {c.rdv_date && (
              <p>
                <strong>📅 RDV prévu :</strong> {new Date(c.rdv_date).toLocaleString()}
              </p>
            )}

            <textarea
              placeholder="Ajouter un commentaire ici..."
              value={commentaire[c.id] || ""}
              onChange={(e) =>
                setCommentaire((prev) => ({
                  ...prev,
                  [c.id]: e.target.value,
                }))
              }
              style={{
                width: "100%",
                marginTop: 10,
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />

            {c.statut === "rdv" && (
              <div style={{ marginTop: 15 }}>
                <p>
                  <strong>🕓 RDV à valider :</strong>
                </p>
                <button
                  onClick={() => validerSignature(c.id, "Signature")}
                  style={{
                    marginRight: 10,
                    backgroundColor: "#4CAF50",
                    color: "#fff",
                    padding: "6px 10px",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  ✅ Signature
                </button>
                <button
                  onClick={() => validerSignature(c.id, "Non Signature")}
                  style={{
                    backgroundColor: "#f44336",
                    color: "#fff",
                    padding: "6px 10px",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  ❌ Non Signature
                </button>
              </div>
            )}

            {historique.length > 0 && (
              <div
                style={{
                  marginTop: 15,
                  backgroundColor: "#f7f7f7",
                  padding: 10,
                  borderRadius: 6,
                }}
              >
                <strong>🕓 3 derniers appels :</strong>
                <ul style={{ marginTop: 6 }}>
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
