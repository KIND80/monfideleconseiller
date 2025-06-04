import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
      const response = await supabase
        .from("call_history")
        .select("id, date, statut_appel, commentaire")
        .eq("contact_id", current.id)
        .order("date", { ascending: false })
        .limit(3);
      setHistorique((response.data || []) as any);
    };
    fetchHistorique();
  }, [current]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

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
      <p style={{ textAlign: "center", padding: "40px 20px" }}>
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
        fontFamily: "Segoe UI",
        padding: 16,
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2 style={{ fontSize: "1.5rem" }}>📂 Portefeuille Global</h2>
        <button onClick={handleLogout} style={btn("gray")}>
          🔓 Déconnexion
        </button>
      </header>

      <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="🔍 Rechercher numéro"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={inputStyle}
        />
        <select
          value={categorie}
          onChange={(e) => setCategorie(e.target.value)}
          style={inputStyle}
        >
          <option value="">Catégorie</option>
          <option value="phoning">Phoning</option>
          <option value="subside">Subside</option>
        </select>
      </div>

      <div style={card}>
        <div
          style={{ display: "flex", alignItems: "center", marginBottom: 16 }}
        >
          <img
            src={avatarUrl}
            alt="avatar"
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              marginRight: 12,
            }}
          />
          <div>
            <h3 style={{ margin: 0 }}>{current.nom}</h3>
            <small style={{ color: "#666" }}>{current.telephone}</small>
          </div>
        </div>

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

        {etatAppel === "init" && (
          <div style={{ marginTop: 12 }}>
            <a href={`tel:${current.telephone}`}>
              <button
                onClick={() => setEtatAppel("en_cours")}
                style={btn("blue")}
              >
                📞 Appeler
              </button>
            </a>
            <button onClick={nextContact} style={btn("gray")}>
              ⏭️ Passer
            </button>
          </div>
        )}

        {etatAppel === "en_cours" && (
          <div style={{ marginTop: 12 }}>
            <button onClick={handleInjoignable} style={btn("red")}>
              ❌ Injoignable
            </button>
            <button onClick={() => setEtatAppel("oui")} style={btn("green")}>
              ✅ Oui
            </button>
          </div>
        )}

        {etatAppel === "oui" && (
          <div style={{ marginTop: 12 }}>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="📝 Ajouter un commentaire"
              style={{ ...inputStyle, height: 80 }}
            />
            <div style={{ marginTop: 8 }}>
              <button
                onClick={handleRdv}
                disabled={!commentaire.trim()}
                style={btn("blue")}
              >
                📅 RDV
              </button>
              <button
                onClick={handleValiderCommentaire}
                disabled={!commentaire.trim()}
                style={btn("gray")}
              >
                📝 Valider
              </button>
            </div>
          </div>
        )}

        {historique.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h4>📞 Derniers appels</h4>
            <ul style={{ paddingLeft: 20 }}>
              {historique.map((appel) => (
                <li key={appel.id}>
                  📅 {new Date(appel.date).toLocaleDateString("fr-FR")} —{" "}
                  {appel.statut_appel}
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

const inputStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 6,
  border: "1px solid #ccc",
  fontSize: "1rem",
};

const btn = (color: "blue" | "green" | "red" | "gray") => {
  const colors: any = {
    blue: "#1976d2",
    green: "#4caf50",
    red: "#f44336",
    gray: "#888",
  };
  return {
    backgroundColor: colors[color],
    color: "#fff",
    padding: "10px 14px",
    marginRight: 8,
    border: "none",
    borderRadius: 6,
    fontWeight: "bold",
    cursor: "pointer",
  } as React.CSSProperties;
};

const card: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: 20,
  backgroundColor: "#fff",
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
};
