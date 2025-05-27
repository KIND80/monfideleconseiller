import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

type Contact = {
  id: string;
  nom: string;
  telephone: string;
  adresse: string;
  npa: string;
  categorie_contact: string;
  type_assurance: string;
  canton: string;
};

type Appel = {
  id: string;
  date: string;
  statut_appel: string;
  commentaire: string;
};

export default function AppelContact({ agentId }: { agentId: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filtered, setFiltered] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [categorie, setCategorie] = useState("");
  const [current, setCurrent] = useState<Contact | null>(null);
  const [etatAppel, setEtatAppel] = useState<"init" | "en_cours" | "oui">("init");
  const [historique, setHistorique] = useState<Appel[]>([]);
  const [commentaire, setCommentaire] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const response = await supabase
        .from("contacts")
        .select("*")
        .eq("statut", "non_assigné")
        .eq("visible_globally", true);

      setContacts(response.data || []);
      setFiltered(response.data || []);
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
      setCurrent(filtres[Math.floor(Math.random() * filtres.length)]);
    }
  }, [search, categorie, contacts]);

  useEffect(() => {
  const fetchHistorique = async () => {
    if (!current) return;

    // 👇 Aucune vérification de type ici
    const response = await supabase
      .from("call_history")
      .select("id, date, statut_appel, commentaire")
      .eq("contact_id", current.id)
      .order("date", { ascending: false })
      .limit(3);

    // 👇 On caste à la fin uniquement
    setHistorique((response.data || []) as any);
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

  const handleInjoignable = async () => {
    await enregistrerAppel("non_signature", "Injoignable");
    nextContact();
  };

  const handleRdv = async () => {
    if (!current || !commentaire.trim()) return;

    await enregistrerAppel("signature", commentaire.trim());

    await supabase
      .from("contacts")
      .update({
        agent_id: agentId,
        statut: "rdv",
        visible_globally: false,
      })
      .eq("id", current.id);

    const url = `https://calendar.google.com/calendar/u/0/r/eventedit?text=RDV+${current.nom}&details=Tel:+${current.telephone}`;
    window.open(url, "_blank");

    nextContact();
  };

  const handleValiderCommentaire = async () => {
    if (!current || !commentaire.trim()) return;

    await enregistrerAppel("signature", commentaire.trim());
    nextContact();
  };

  const nextContact = () => {
    const restants = filtered.filter((c) => c.id !== current?.id);
    setCurrent(
      restants.length > 0
        ? restants[Math.floor(Math.random() * restants.length)]
        : null
    );
    setEtatAppel("init");
    setCommentaire("");
  };

  if (!current) {
    return (
      <p style={{ textAlign: "center", paddingTop: 40 }}>
        📴 Aucun contact pour le moment. Revenez demain.
      </p>
    );
  }

  const avatarUrl = `https://avatars.dicebear.com/api/initials/${encodeURIComponent(
    current.nom || "Contact"
  )}.svg`;

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "Arial",
        maxWidth: 700,
        margin: "auto",
      }}
    >
      <h2>📂 Portefeuille Global</h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="🔍 Rechercher numéro"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <select
          value={categorie}
          onChange={(e) => setCategorie(e.target.value)}
          style={{ padding: 8 }}
        >
          <option value="">Catégorie</option>
          <option value="phoning">Phoning</option>
          <option value="subside">Subside</option>
        </select>
      </div>

      <div style={{ border: "1px solid #ccc", padding: 15, borderRadius: 8 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <img
            src={avatarUrl}
            alt="avatar"
            style={{ width: 50, height: 50, borderRadius: "50%", marginRight: 10 }}
          />
          <h3 style={{ margin: 0 }}>{current.nom}</h3>
        </div>

        <p><strong>📞 Téléphone :</strong> {current.telephone}</p>
        <p><strong>📍 Adresse :</strong> {current.adresse} {current.npa}</p>
        <p><strong>🏷️ Catégorie :</strong> {current.categorie_contact}</p>
        <p><strong>🧭 Canton :</strong> {current.canton}</p>
        <p><strong>🛡️ Assurance :</strong> {current.type_assurance || "—"}</p>

        {etatAppel === "init" ? (
          <div style={{ marginTop: 10 }}>
            <a href={`tel:${current.telephone}`}>
              <button onClick={() => setEtatAppel("en_cours")} style={{ marginRight: 10 }}>
                📞 Appeler
              </button>
            </a>
            <button onClick={nextContact}>⏭️ Passer</button>
          </div>
        ) : etatAppel === "en_cours" ? (
          <div style={{ marginTop: 10 }}>
            <button
              onClick={handleInjoignable}
              style={{
                marginRight: 10,
                backgroundColor: "#f44336",
                color: "#fff",
                padding: "8px",
              }}
            >
              ❌ Injoignable
            </button>
            <button
              onClick={() => setEtatAppel("oui")}
              style={{ backgroundColor: "#4CAF50", color: "#fff", padding: "8px" }}
            >
              ✅ Oui
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 10 }}>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="📝 Ajouter un commentaire obligatoire"
              style={{ width: "100%", padding: 8, marginBottom: 10 }}
              rows={3}
            />
            <div>
              <button
                onClick={handleRdv}
                disabled={!commentaire.trim()}
                style={{ marginRight: 10 }}
              >
                📅 RDV
              </button>
              <button
                onClick={handleValiderCommentaire}
                disabled={!commentaire.trim()}
              >
                📝 Valider le commentaire
              </button>
            </div>
          </div>
        )}

        {historique.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h4>📞 3 derniers appels</h4>
            <ul style={{ paddingLeft: 20 }}>
              {historique.map((appel) => (
                <li key={appel.id}>
                  📅 {new Date(appel.date).toLocaleDateString("fr-FR")} — {appel.statut_appel}
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
