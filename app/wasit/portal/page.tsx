"use client";

// ============================================================
// /wasit/portal — Portal Wasit (daftar lapangan / pertandingan)
// - Membaca sesi wasit dari localStorage (lihat lib/refereeSession).
// - Proteksi sederhana: jika belum login → kembalikan ke /wasit.
// - Terikat ke SATU turnamen sesuai sesi (tournamentId).
// - Saat menyimpan skor, selalu kirim refereeCode + tournamentId
//   agar server memvalidasi ulang akses wasit.
// ============================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SearchInput from "@/components/SearchInput";
import { displayParticipantName, parseSlotToken } from "@/lib/bracketSlot";
import {
  getRefereeSession,
  clearRefereeSession,
  type RefereeSession,
} from "@/lib/refereeSession";

// ============================================================
// TYPES
// ============================================================
type GroupMatch = {
  id: number;
  groupId: number;
  player1Name: string;
  player2Name: string;
  score1: number | null;
  score2: number | null;
  winnerName: string | null;
  refereeName: string | null;
  status: string;
};
type KnockoutMatch = {
  id: number;
  category: string;
  roundText: string;
  matchOrder: number;
  player1Name: string | null;
  player2Name: string | null;
  score1: number | null;
  score2: number | null;
  winnerName: string | null;
  refereeName: string | null;
  status: string;
};
type GroupData = {
  id: number;
  name: string;
  category: string;
  matches: GroupMatch[];
};
type PoolMatch = {
  id: number;
  member1Name: string;
  member2Name: string;
  score1: number | null;
  score2: number | null;
  winnerName: string | null;
  status: string;
};
type PoolData = {
  id: number;
  label: string;
  poolCode: string;
  categoryKey: string;
  matches: PoolMatch[];
};
type PoolApiMember = { memberName: string } | null;
type PoolApiMatch = {
  id: number;
  member1: PoolApiMember;
  member2: PoolApiMember;
  score1: number | null;
  score2: number | null;
  winnerName: string | null;
  status: string;
};
type PoolApiPool = {
  id: number;
  label: string;
  poolCode: string;
  categoryKey: string;
  matches: PoolApiMatch[];
};

const mapApiPool = (p: PoolApiPool): PoolData => ({
  id: p.id,
  label: p.label,
  poolCode: p.poolCode,
  categoryKey: p.categoryKey,
  matches: (p.matches ?? []).map((m) => ({
    id: m.id,
    member1Name: m.member1?.memberName ?? "Menunggu",
    member2Name: m.member2?.memberName ?? "Menunggu",
    score1: m.score1,
    score2: m.score2,
    winnerName: m.winnerName,
    status: m.status,
  })),
});

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function WasitPortalPage() {
  const router = useRouter();

  // Sesi wasit dari localStorage
  const [session, setSession] = useState<RefereeSession | null>(null);
  const [mounted, setMounted] = useState(false);

  // Data turnamen
  const [tournamentName, setTournamentName] = useState("");
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [pools, setPools] = useState<PoolData[]>([]);
  const [knockouts, setKnockouts] = useState<KnockoutMatch[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [activeTab, setActiveTab] = useState<"grup" | "knockout">("grup");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Score modal
  type ScoreTarget =
    | { type: "group"; match: GroupMatch; groupId: number }
    | { type: "pool"; match: PoolMatch; pool: PoolData }
    | { type: "knockout"; match: KnockoutMatch };

  const [scoreTarget, setScoreTarget] = useState<ScoreTarget | null>(null);
  const [tempScore1, setTempScore1] = useState("");
  const [tempScore2, setTempScore2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ======================== SESSION / PROTEKSI ========================
  // Contoh membaca sesi dari localStorage + proteksi: jika belum login,
  // kembalikan ke form login (/wasit).
  useEffect(() => {
    const savedSession = getRefereeSession();
    if (!savedSession) {
      router.replace("/wasit");
      setMounted(true);
      return;
    }
    setSession(savedSession);
    setMounted(true);
    loadTournament(savedSession.tournamentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    clearRefereeSession();
    router.replace("/wasit");
  }

  // ======================== LOAD DATA ========================
  async function loadTournament(tournamentId: string) {
    const tid = Number(tournamentId);
    if (!tid || Number.isNaN(tid)) {
      handleLogout();
      return;
    }
    setLoading(true);
    try {
      // Nama turnamen — sekaligus cek turnamen masih ada
      const tRes = await fetch(`/api/tournaments/${tid}`, { cache: "no-store" });
      const tData = await tRes.json();
      if (!tRes.ok || !tData.success) {
        // Sesi basi (turnamen dihapus/diarsipkan) → logout
        clearRefereeSession();
        router.replace("/wasit");
        return;
      }
      setTournamentName(tData.data?.name ?? "");

      // Grup matches (legacy)
      const resG = await fetch(`/api/tournaments/${tid}/brackets`, { cache: "no-store" });
      const dataG = await resG.json();
      const fetchedGroups: GroupData[] = dataG.data?.groups || [];

      // Pool + match pool
      const resP = await fetch(`/api/tournaments/${tid}/pools`, { cache: "no-store" });
      const dataP = await resP.json();
      const allPools: PoolApiPool[] = dataP.data?.pools || [];
      const fetchedPools: PoolData[] = allPools.map(mapApiPool);
      setGroups(fetchedGroups);
      setPools(fetchedPools);

      // Kategori: gabungan grup legacy + pool
      const cats = [
        ...new Set([
          ...fetchedGroups.map((g) => g.category),
          ...fetchedPools.map((p) => p.categoryKey),
        ]),
      ];
      setCategories(cats);
      if (cats.length > 0) {
        setActiveCategory(cats[0]);
        await loadKnockout(tid, cats[0]);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function loadKnockout(tId: number, cat: string) {
    try {
      const resK = await fetch(`/api/tournaments/${tId}/brackets/knockout?category=${cat}`, {
        cache: "no-store",
      });
      const dataK = await resK.json();
      setKnockouts(Array.isArray(dataK.data) ? dataK.data : []);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCategoryChange(cat: string) {
    setActiveCategory(cat);
    if (session) {
      setLoading(true);
      await loadKnockout(Number(session.tournamentId), cat);
      setLoading(false);
    }
  }

  async function refreshAll() {
    if (!session) return;
    const tid = Number(session.tournamentId);
    setLoading(true);
    try {
      const resG = await fetch(`/api/tournaments/${tid}/brackets`, { cache: "no-store" });
      const dataG = await resG.json();
      setGroups(dataG.data?.groups || []);

      const resP = await fetch(`/api/tournaments/${tid}/pools`, { cache: "no-store" });
      const dataP = await resP.json();
      const allPools: PoolApiPool[] = dataP.data?.pools || [];
      setPools(allPools.map(mapApiPool));

      await loadKnockout(tid, activeCategory);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  // ======================== SCORE ========================
  function openScoreModal(target: ScoreTarget) {
    setScoreTarget(target);
    setTempScore1("");
    setTempScore2("");
    setSubmitMsg(null);
  }

  async function handleSubmitScore(e: React.FormEvent) {
    e.preventDefault();
    if (!scoreTarget || tempScore1 === "" || tempScore2 === "") return;
    if (!session) return;

    // Server memvalidasi ulang refereeCode + tournamentId
    const authPayload = {
      refereeName: session.refereeName,
      refereeCode: session.refereeCode,
      tournamentId: session.tournamentId,
    };
    const tournamentId = Number(session.tournamentId);

    setSubmitting(true);
    setSubmitMsg(null);

    try {
      let res;
      if (scoreTarget.type === "group") {
        res = await fetch(`/api/tournaments/${tournamentId}/brackets/matches`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchId: scoreTarget.match.id,
            score1: Number(tempScore1),
            score2: Number(tempScore2),
            ...authPayload,
          }),
        });
      } else if (scoreTarget.type === "pool") {
        res = await fetch(
          `/api/tournaments/${tournamentId}/pools/${scoreTarget.pool.id}/matches`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              matchId: scoreTarget.match.id,
              score1: Number(tempScore1),
              score2: Number(tempScore2),
              ...authPayload,
            }),
          }
        );
      } else {
        res = await fetch(`/api/tournaments/${tournamentId}/brackets/knockout`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchId: scoreTarget.match.id,
            score1: Number(tempScore1),
            score2: Number(tempScore2),
            ...authPayload,
          }),
        });
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitMsg({ type: "success", text: "✅ Skor berhasil disimpan!" });
        await refreshAll();
        setTimeout(() => setScoreTarget(null), 1200);
      } else {
        setSubmitMsg({ type: "error", text: `❌ ${data.message || "Gagal menyimpan skor"}` });
      }
    } catch (err) {
      console.error(err);
      setSubmitMsg({ type: "error", text: "❌ Terjadi kesalahan jaringan." });
    }
    setSubmitting(false);
  }

  // ======================== DERIVED ========================
  const activePools = pools.filter((p) => p.categoryKey === activeCategory);
  const hasPool = activePools.length > 0;
  const scheduledPoolMatches = activePools.flatMap((p) =>
    p.matches
      .filter((m) => m.status === "SCHEDULED")
      .map((m) => ({ ...m, poolId: p.id, poolLabel: p.label, poolCode: p.poolCode }))
  );
  const donePoolMatches = activePools.flatMap((p) =>
    p.matches
      .filter((m) => m.status === "DONE")
      .map((m) => ({ ...m, poolId: p.id, poolLabel: p.label, poolCode: p.poolCode }))
  );
  const filteredGroups = groups.filter((g) => g.category === activeCategory);
  const scheduledGroupMatches = filteredGroups.flatMap((g) =>
    g.matches
      .filter((m) => m.status === "SCHEDULED")
      .map((m) => ({ ...m, groupName: g.name, groupId: g.id }))
  );
  const doneGroupMatches = filteredGroups.flatMap((g) =>
    g.matches
      .filter((m) => m.status === "DONE")
      .map((m) => ({ ...m, groupName: g.name, groupId: g.id }))
  );
  const scheduledKnockouts = knockouts.filter(
    (k) =>
      k.status === "SCHEDULED" &&
      k.player1Name &&
      k.player2Name &&
      k.player1Name !== "BYE" &&
      k.player2Name !== "BYE" &&
      !parseSlotToken(k.player1Name) &&
      !parseSlotToken(k.player2Name)
  );
  const doneKnockouts = knockouts.filter((k) => k.status === "DONE");

  const q = search.trim().toLowerCase();
  const qMatch = (name: string | null | undefined) => (name ?? "").toLowerCase().includes(q);
  const filteredScheduledGroupMatches = scheduledGroupMatches.filter(
    (m) => !q || qMatch(m.player1Name) || qMatch(m.player2Name) || (m.groupName ?? "").toLowerCase().includes(q)
  );
  const filteredDoneGroupMatches = doneGroupMatches.filter(
    (m) => !q || qMatch(m.player1Name) || qMatch(m.player2Name) || (m.groupName ?? "").toLowerCase().includes(q)
  );
  const filteredScheduledKnockouts = scheduledKnockouts.filter(
    (k) => !q || qMatch(k.player1Name) || qMatch(k.player2Name) || (k.roundText ?? "").toLowerCase().includes(q)
  );
  const filteredDoneKnockouts = doneKnockouts.filter(
    (k) => !q || qMatch(k.player1Name) || qMatch(k.player2Name) || (k.roundText ?? "").toLowerCase().includes(q)
  );
  const filteredScheduledPoolMatches = scheduledPoolMatches.filter(
    (m) => !q || qMatch(m.member1Name) || qMatch(m.member2Name) || (m.poolLabel ?? "").toLowerCase().includes(q)
  );
  const filteredDonePoolMatches = donePoolMatches.filter(
    (m) => !q || qMatch(m.member1Name) || qMatch(m.member2Name) || (m.poolLabel ?? "").toLowerCase().includes(q)
  );

  const categoryLabel = (cat: string) => {
    const parts = cat.split("_");
    const grade = parts[0] || "";
    const gender = parts[1] === "MALE" ? "Putra" : parts[1] === "FEMALE" ? "Putri" : "";
    const type =
      parts[2] === "SINGLE" ? "Tunggal" : parts[2] === "DOUBLE" ? "Ganda" : parts[1] === "MIXED" ? "Ganda Campuran" : parts[2] || "";
    return [grade, gender, type].filter(Boolean).join(" · ");
  };

  // ============================================================
  // RENDER — SPLASH (saat memulihkan session)
  // ============================================================
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand via-brand-2 to-brand flex items-center justify-center p-4">
        <div className="text-center">
          <span className="text-4xl inline-block animate-bounce">🏁</span>
          <p className="text-slate-400 mt-4 text-sm">Memuat portal...</p>
        </div>
      </div>
    );
  }

  // Proteksi: tanpa sesi, tidak boleh melihat konten portal
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand via-brand-2 to-brand">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[rgba(28,15,15,0.8)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.1)]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-black text-[#ffffff]">🏁 Portal Wasit</h1>
            <p className="text-xs text-amber-400 font-semibold truncate">
              Wasit: {session.refereeName}
              {tournamentName ? ` · ${tournamentName}` : ""}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs px-4 py-2 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] text-slate-300 rounded-lg hover:bg-[rgba(255,255,255,0.2)] transition-colors shrink-0"
          >
            Keluar
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Info turnamen */}
        {tournamentName && (
          <div className="bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.15)] rounded-2xl px-5 py-4">
            <h2 className="text-[#ffffff] font-bold text-xl truncate">{tournamentName}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Daftar lapangan &amp; pertandingan</p>
          </div>
        )}

        {/* Category Tabs */}
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? "bg-primary text-[#ffffff] shadow-lg shadow-primary-800/30"
                    : "bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.15)] text-slate-300 hover:bg-[rgba(255,255,255,0.2)]"
                }`}
              >
                {categoryLabel(cat)}
              </button>
            ))}
          </div>
        )}

        {/* Search pertandingan */}
        <SearchInput
          variant="dark"
          value={search}
          onChange={setSearch}
          placeholder="Cari pemain / grup / ronde..."
        />

        {/* Tab Grup/Knockout */}
        <div className="flex gap-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl p-1">
          {(["grup", "knockout"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold capitalize transition-all ${
                activeTab === tab
                  ? "bg-white text-slate-900 shadow"
                  : "text-slate-400 hover:text-[#ffffff]"
              }`}
            >
              {tab === "grup" ? "🏓 Fase Grup" : "⚔️ Fase Gugur"}
            </button>
          ))}
        </div>

        {loading && <div className="text-center py-8 text-slate-400 text-sm">Memuat data...</div>}

        {!loading && activeTab === "grup" && hasPool && (
          <div className="space-y-6">
            <section>
              <h3 className="text-[#ffffff] font-bold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                Pertandingan Menunggu Input ({filteredScheduledPoolMatches.length})
              </h3>
              {filteredScheduledPoolMatches.length === 0 ? (
                <p className="text-slate-500 text-sm">Semua pertandingan pool sudah selesai.</p>
              ) : (
                <div className="grid gap-3">
                  {filteredScheduledPoolMatches.map((m) => (
                    <MatchCard
                      key={m.id}
                      player1={m.member1Name}
                      player2={m.member2Name}
                      score1={null}
                      score2={null}
                      status="SCHEDULED"
                      groupName={m.poolLabel}
                      onInput={() => {
                        const pool = activePools.find((p) => p.id === m.poolId);
                        if (pool) openScoreModal({ type: "pool", match: m, pool });
                      }}
                    />
                  ))}
                </div>
              )}
            </section>

            {filteredDonePoolMatches.length > 0 && (
              <section>
                <h3 className="text-slate-400 font-bold mb-3 text-sm uppercase tracking-wider">
                  Selesai ({filteredDonePoolMatches.length})
                </h3>
                <div className="grid gap-2">
                  {filteredDonePoolMatches.map((m) => (
                    <MatchCard
                      key={m.id}
                      player1={m.member1Name}
                      player2={m.member2Name}
                      score1={m.score1}
                      score2={m.score2}
                      status="DONE"
                      groupName={m.poolLabel}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {!loading && activeTab === "grup" && !hasPool && (
          <div className="space-y-6">
            <section>
              <h3 className="text-[#ffffff] font-bold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                Pertandingan Menunggu Input ({filteredScheduledGroupMatches.length})
              </h3>
              {filteredScheduledGroupMatches.length === 0 ? (
                <p className="text-slate-500 text-sm">Semua pertandingan sudah selesai.</p>
              ) : (
                <div className="grid gap-3">
                  {filteredScheduledGroupMatches.map((m) => (
                    <MatchCard
                      key={m.id}
                      player1={m.player1Name}
                      player2={m.player2Name}
                      score1={null}
                      score2={null}
                      status="SCHEDULED"
                      groupName={m.groupName}
                      onInput={() => openScoreModal({ type: "group", match: m, groupId: m.groupId })}
                    />
                  ))}
                </div>
              )}
            </section>

            {filteredDoneGroupMatches.length > 0 && (
              <section>
                <h3 className="text-slate-400 font-bold mb-3 text-sm uppercase tracking-wider">
                  Selesai ({filteredDoneGroupMatches.length})
                </h3>
                <div className="grid gap-2">
                  {filteredDoneGroupMatches.map((m) => (
                    <MatchCard
                      key={m.id}
                      player1={m.player1Name}
                      player2={m.player2Name}
                      score1={m.score1}
                      score2={m.score2}
                      status="DONE"
                      groupName={m.groupName}
                      refereeName={m.refereeName}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {!loading && activeTab === "knockout" && (
          <div className="space-y-6">
            <section>
              <h3 className="text-[#ffffff] font-bold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                Pertandingan Menunggu Input ({filteredScheduledKnockouts.length})
              </h3>
              {filteredScheduledKnockouts.length === 0 ? (
                <p className="text-slate-500 text-sm">
                  Tidak ada pertandingan gugur yang menunggu, atau bracket belum digenerate.
                </p>
              ) : (
                <div className="grid gap-3">
                  {filteredScheduledKnockouts.map((k) => (
                    <MatchCard
                      key={k.id}
                      player1={displayParticipantName(k.player1Name)}
                      player2={displayParticipantName(k.player2Name)}
                      score1={null}
                      score2={null}
                      status="SCHEDULED"
                      groupName={k.roundText}
                      onInput={() => openScoreModal({ type: "knockout", match: k })}
                    />
                  ))}
                </div>
              )}
            </section>

            {filteredDoneKnockouts.length > 0 && (
              <section>
                <h3 className="text-slate-400 font-bold mb-3 text-sm uppercase tracking-wider">
                  Selesai ({filteredDoneKnockouts.length})
                </h3>
                <div className="grid gap-2">
                  {filteredDoneKnockouts.map((k) => (
                    <MatchCard
                      key={k.id}
                      player1={k.player1Name || "Menunggu"}
                      player2={k.player2Name || "Menunggu"}
                      score1={k.score1}
                      score2={k.score2}
                      status="DONE"
                      groupName={k.roundText}
                      refereeName={k.refereeName}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Score Input Modal */}
      {scoreTarget && session && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-brand border border-[rgba(255,255,255,0.15)] rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-[#ffffff] text-center mb-1">Input Skor</h3>
            <p className="text-xs text-amber-400 text-center mb-5 font-semibold">
              Wasit: {session.refereeName}
            </p>

            <form onSubmit={handleSubmitScore} className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex-1 text-center">
                  <p className="text-xs text-slate-400 font-medium mb-2 leading-tight truncate">
                    {scoreTarget.type === "pool"
                      ? scoreTarget.match.member1Name
                      : scoreTarget.match.player1Name || "Menunggu"}
                  </p>
                  <input
                    type="number"
                    min="0"
                    required
                    value={tempScore1}
                    onChange={(e) => setTempScore1(e.target.value)}
                    className="w-full h-20 text-center text-4xl font-black bg-[rgba(255,255,255,0.1)] border-2 border-[rgba(255,255,255,0.2)] rounded-2xl text-[#ffffff] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    autoFocus
                  />
                </div>
                <span className="text-2xl font-black text-slate-500 mt-4">VS</span>
                <div className="flex-1 text-center">
                  <p className="text-xs text-slate-400 font-medium mb-2 leading-tight truncate">
                    {scoreTarget.type === "pool"
                      ? scoreTarget.match.member2Name
                      : scoreTarget.match.player2Name || "Menunggu"}
                  </p>
                  <input
                    type="number"
                    min="0"
                    required
                    value={tempScore2}
                    onChange={(e) => setTempScore2(e.target.value)}
                    className="w-full h-20 text-center text-4xl font-black bg-[rgba(255,255,255,0.1)] border-2 border-[rgba(255,255,255,0.2)] rounded-2xl text-[#ffffff] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {submitMsg && (
                <div
                  className={`text-center text-sm font-semibold rounded-xl px-4 py-3 ${
                    submitMsg.type === "success"
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}
                >
                  {submitMsg.text}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setScoreTarget(null)}
                  className="flex-1 py-3 bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.15)] text-slate-300 rounded-xl font-bold hover:bg-[rgba(255,255,255,0.2)] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || tempScore1 === "" || tempScore2 === ""}
                  className="flex-1 py-3 bg-primary hover:bg-primary-hover text-[#ffffff] rounded-xl font-black transition-colors disabled:opacity-40 shadow-lg shadow-primary-800/20"
                >
                  {submitting ? "Menyimpan..." : "Simpan Skor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MATCH CARD COMPONENT
// ============================================================
function MatchCard({
  player1,
  player2,
  score1,
  score2,
  status,
  groupName,
  refereeName,
  onInput,
}: {
  player1: string;
  player2: string;
  score1: number | null;
  score2: number | null;
  status: string;
  groupName?: string;
  refereeName?: string | null;
  onInput?: () => void;
}) {
  const isDone = status === "DONE";
  const p1Wins = isDone && score1 !== null && score2 !== null && score1 > score2;
  const p2Wins = isDone && score1 !== null && score2 !== null && score2 > score1;

  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        isDone
          ? "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)]"
          : "bg-[rgba(255,255,255,0.1)] border-amber-400/30 hover:border-primary/60"
      }`}
    >
      <div className="flex items-center gap-1 mb-3">
        {groupName && <span className="text-xs text-slate-500 font-medium">{groupName}</span>}
        <span
          className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
            isDone ? "bg-green-500/20 text-green-400" : "bg-primary/20 text-amber-400"
          }`}
        >
          {isDone ? "Selesai" : "Menunggu"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <p className={`flex-1 font-bold text-sm truncate ${p1Wins ? "text-amber-300" : "text-[#ffffff]"}`}>
          {player1} {p1Wins && "🏆"}
        </p>
        {isDone ? (
          <div className="text-center font-black text-lg text-[#ffffff] shrink-0">
            <span className={p1Wins ? "text-amber-300" : ""}>{score1}</span>
            <span className="text-slate-500 mx-1">–</span>
            <span className={p2Wins ? "text-amber-300" : ""}>{score2}</span>
          </div>
        ) : (
          <div className="text-center shrink-0">
            <span className="text-slate-500 font-bold text-xs">VS</span>
          </div>
        )}
        <p className={`flex-1 font-bold text-sm truncate text-right ${p2Wins ? "text-amber-300" : "text-[#ffffff]"}`}>
          {p2Wins && "🏆 "}
          {player2}
        </p>
      </div>

      {refereeName && <p className="text-xs text-slate-500 mt-2 text-center">Wasit: {refereeName}</p>}

      {!isDone && onInput && (
        <button
          onClick={onInput}
          className="w-full mt-3 py-2.5 bg-primary hover:bg-primary-hover text-[#ffffff] rounded-xl font-bold text-sm transition-colors shadow shadow-primary-800/20"
        >
          Input Skor
        </button>
      )}
    </div>
  );
}