'use client'

import React, { useState } from 'react'
import type { MatchType, Player } from '@prisma/client'
import { processTeamRegistration } from './action'
import { showError } from '@/lib/swal'
import { gradeToLabel } from '@/lib/tournamentGrades'
import PlayerCombobox, { ComboboxItem } from '@/components/PlayerCombobox'

interface RegistrationFormProps {
  tournamentId: number
  players: Player[]
  grades: string[]
}

export default function RegistrationForm({ tournamentId, players, grades }: RegistrationFormProps) {
  const [matchType, setMatchType] = useState<MatchType>('SINGLE')
  const [grade, setGrade] = useState<string>(grades[0] ?? 'SMA')
  
  const [player1Id, setPlayer1Id] = useState<string>('')
  const [player2Id, setPlayer2Id] = useState<string>('')

  // State to show loading spinner on submit
  const [isPending, setIsPending] = useState(false)

  // Validate on the fly
  let validationError = ''
  
  const p1 = players.find(p => p.id.toString() === player1Id)
  const p2 = players.find(p => p.id.toString() === player2Id)

  const player1Items: ComboboxItem[] = players.map(p => ({
    value: p.id.toString(),
    label: p.fullName,
    subtitle: `${p.gender === 'MALE' ? 'Putra' : 'Putri'}${p.schoolName ? ` • ${p.schoolName}` : ''}`,
  }))

  // Untuk Player 2: pemain yang sudah dipilih di Player 1 dinonaktifkan
  const player2Items: ComboboxItem[] = players.map(p => ({
    value: p.id.toString(),
    label: p.fullName,
    subtitle: `${p.gender === 'MALE' ? 'Putra' : 'Putri'}${p.schoolName ? ` • ${p.schoolName}` : ''}`,
    disabled: p.id.toString() === player1Id,
  }))

  if (matchType !== 'SINGLE' && p1 && p2) {
    if (p1.id === p2.id) {
      validationError = 'Player 1 dan Player 2 tidak boleh orang yang sama.'
    } else if (matchType === 'DOUBLE') {
      if (p1.gender !== p2.gender) {
        validationError = 'DOUBLE: Kedua pemain harus memiliki gender yang SAMA.'
      }
    } else if (matchType === 'MIXED') {
      if (p1.gender === p2.gender) {
        validationError = 'MIXED: Kedua pemain harus memiliki gender yang BERBEDA.'
      }
    }
  }

  // Handle Action wrapper to get pending state
  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    // processTeamRegistration handles the backend logic
    const res = await processTeamRegistration(null, formData)
    if (res && res.error) {
      showError(res.error) // show error if action returned an error
      setIsPending(false)
    }
  }

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 md:p-10 mb-8">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span>📝</span> Registrasi Kategori Pemain & Tim
      </h2>
      
      <form action={handleSubmit} className="space-y-6">
        <input type="hidden" name="tournamentId" value={tournamentId} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Match Type */}
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Tipe Pertandingan</label>
            <select
              title="Match Type"
              name="matchType"
              value={matchType}
              onChange={(e) => {
                setMatchType(e.target.value as MatchType)
                // Reset player 2 if single
                if (e.target.value === 'SINGLE') {
                  setPlayer2Id('')
                }
              }}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/15 focus:border-primary transition-all outline-none font-medium text-slate-700"
            >
              <option value="SINGLE">Single</option>
              <option value="DOUBLE">Double (Ganda)</option>
              <option value="MIXED">Mixed (Ganda Campuran)</option>
            </select>
          </div>

          {/* Grade */}
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Tingkat (Grade)</label>
            <select
              title="Grade"
              name="grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/15 focus:border-primary transition-all outline-none font-medium text-slate-700"
            >
              {grades.map((g) => (
                <option key={g} value={g}>{gradeToLabel(g)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Player Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Pilih Player 1</label>
            <input type="hidden" name="player1Id" value={player1Id} />
            <PlayerCombobox
              items={player1Items}
              value={player1Id}
              onChange={(v) => {
                setPlayer1Id(v)
                if (p2 && v === p2.id.toString()) setPlayer2Id('')
              }}
              placeholder="Ketik nama pemain..."
            />
          </div>

          {matchType !== 'SINGLE' && (
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Pilih Player 2</label>
              <input type="hidden" name="player2Id" value={player2Id} />
              <PlayerCombobox
                items={player2Items}
                value={player2Id}
                onChange={setPlayer2Id}
                placeholder="Ketik nama pemain..."
              />
            </div>
          )}
        </div>

        {/* Custom Team Name (Opțional untuk Double/Mixed) */}
        {matchType !== 'SINGLE' && (
           <div className="pt-4">
             <label className="text-sm font-bold text-slate-700 block mb-2">Nama Tim (Opsional)</label>
             <input 
               type="text" 
               name="teamName" 
               placeholder="Contoh: Smash Squad (Otomatis jika dikosongkan)"
               className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/15 focus:border-primary transition-all outline-none font-medium text-slate-700"
             />
             <p className="text-xs text-slate-500 mt-2">Apabila kosong, sistem akan menghasilkan &ldquo;[Nama P1] &amp; [Nama P2]&rdquo;.</p>
           </div>
        )}

        {/* Validation Warning Alert */}
        {validationError && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 font-medium animate-in fade-in flex items-center gap-2">
            <span>⚠️</span> {validationError}
          </div>
        )}

        {/* Submit Action */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={!!validationError || isPending}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-primary to-amber-500 text-[#ffffff] font-bold text-lg p-4 rounded-2xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary-800/30"
          >
            {isPending ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <span>Rakit & Daftarkan ke Pool 🚀</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
