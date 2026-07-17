// Naskah dialog quest NPC Rafi (Episode 1 — "Awal yang Baru").
// Mengikuti persis struktur naskah di episode-1-naskah-quest.md
// (§4 Naskah Dialog): node 1-3 linear (pembuka -> konteks -> puncak
// candaan) -> node 4 titik cabang 3 pilihan -> node 5a/5b/5c reaksi
// Rafi menyesuaikan pilihan -> node 6 penutup (sama untuk semua
// cabang).
//
// `{PLAYER_NAME}` diganti runtime oleh DialogueBox dengan nama tokoh
// yang diisi pemain di MenuScene (lihat characterName.js). Kalau belum
// ada (fallback, seharusnya tidak pernah terjadi karena MenuScene
// mewajibkan pengisian), dipakai 'Kamu'.
//
// Setiap node:
//   { id, speaker: 'rafi' | 'player', text, next? }
//   Node cabang punya `choices` (bukan `next`) — array
//   { id, label, scoreKey, next }.
//
// `scoreKey` dipakai untuk mengisi `choices` yang dikirim ke backend
// lewat completeEpisode()/finishEpisode() (tabel
// user_episode_progress.choices, JSONB) — dipetakan ke skor tersembunyi
// (assertiveness/empathy/risk-awareness) yang nanti diakumulasi lintas
// episode untuk menentukan ending Episode 9. Format skor persis belum
// difinalkan di backend (kolom JSONB bebas), jadi field ini aman
// ditambah tanpa migration lagi.

// --- Dialog kunjungan ULANG (gaya Harvest Moon) --------------------
// Setelah quest utama (node n1..n6 di bawah) selesai, pemain masih
// boleh mengajak Rafi bicara lagi (lihat Episode1Scene._tryTalkToNpc) —
// tapi bukan mengulang naskah quest yang sama. Ini beberapa baris
// obrolan ringan yang dipilih ACAK setiap kali, persis pola NPC di
// Harvest Moon yang punya beberapa variasi basa-basi harian dan tidak
// pernah mengulang "cutscene" perkenalan lagi. Tidak ada choices/skor
// di sini — murni flavor text, tidak memengaruhi progres/skor apa pun.
const EPISODE1_REVISIT_LINES = [
  'Eh, gimana? Udah mulai betah belum di sini?',
  'Woles aja soal becandaan tadi ya, aku beneran nggak ada maksud jahat kok.',
  'Nanti kalau butuh temen ke kantin atau nanya-nanya soal sekolah sini, samperin aku aja.',
  'Btw kelasnya asik kan? Lumayan seru sih kalau udah kenal semua orang.',
];

let lastRevisitIndex = -1;

/** Bangun dialogueTree satu-node untuk kunjungan ulang, teksnya dipilih
 * acak (tidak mengulang baris yang sama persis dua kali berturut-turut
 * kalau variasinya lebih dari satu). */
export function buildEpisode1RevisitDialogue() {
  let index = Math.floor(Math.random() * EPISODE1_REVISIT_LINES.length);
  if (EPISODE1_REVISIT_LINES.length > 1 && index === lastRevisitIndex) {
    index = (index + 1) % EPISODE1_REVISIT_LINES.length;
  }
  lastRevisitIndex = index;

  return {
    npcId: 'rafi',
    startNode: 'revisit',
    nodes: {
      revisit: {
        id: 'revisit',
        speaker: 'rafi',
        text: EPISODE1_REVISIT_LINES[index],
      },
    },
  };
}

export const EPISODE1_DIALOGUE = {
  npcId: 'rafi',
  startNode: 'n1',
  nodes: {
    n1: {
      id: 'n1',
      speaker: 'rafi',
      text: 'Eh, lo murid baru itu kan? Yang tadi masuk kelas pas udah mulai?',
      next: 'n1b',
    },
    n1b: {
      id: 'n1b',
      speaker: 'rafi',
      text: 'Santai aja, gue becanda. Sini duduk, gue kenalin sama yang lain.',
      next: 'n2',
    },
    n2: {
      id: 'n2',
      speaker: 'rafi',
      text: 'Btw nama lo aneh juga ya, hahaha— becanda, becanda. Eh tapi lo pindahan dari mana emang? Kok bisa masuk pertengahan semester gini?',
      next: 'n2b',
    },
    n2b: {
      id: 'n2b',
      speaker: 'rafi',
      text: 'Oh gitu. Yaudah, lo duduk situ aja deh, kosong kok. Tapi jangan kaget ya, anak-anak sini emang suka iseng. Gue duluan yang paling sering, hehe.',
      next: 'n3',
    },
    n3: {
      id: 'n3',
      speaker: 'rafi',
      text: 'Eh serius deh, lo tuh mirip banget sama meme yang lagi viral itu lho — yang muka bengong gitu. Wkwk sumpah mirip!',
      next: 'n3b',
    },
    n3b: {
      id: 'n3b',
      speaker: 'rafi',
      text: 'Becanda doang kok, jangan baper ya. Lagian kalo lo gak bisa terima becandaan, ntar susah temenan sama anak-anak sini lho.',
      next: 'n4',
    },
    // --- Titik cabang ---
    n4: {
      id: 'n4',
      speaker: 'narration',
      text: 'Gimana respons {PLAYER_NAME}?',
      choices: [
        {
          id: 'a',
          label: '"Iya deh, gapapa kok."',
          scoreKey: 'passive',
          next: 'n5a',
        },
        {
          id: 'b',
          label: '"Hehe iya sih... tapi kalau kelewatan aku bakal bilang ya."',
          scoreKey: 'assertiveness',
          next: 'n5b',
        },
        {
          id: 'c',
          label: '"Aku nggak nyaman kalau dibandingin gitu, deh."',
          scoreKey: 'assertiveness_high',
          next: 'n5c',
        },
      ],
    },
    n5a: {
      id: 'n5a',
      speaker: 'rafi',
      text: 'Nah gitu dong, santai aja. Yaudah yuk balik, bel bentar lagi bunyi.',
      next: 'n6',
    },
    n5b: {
      id: 'n5b',
      speaker: 'rafi',
      text: 'Oh— oke sih, noted. Gak masalah kok. Yaudah yuk balik kelas.',
      next: 'n6',
    },
    n5c: {
      id: 'n5c',
      speaker: 'rafi',
      text: 'Eh... oke, maaf ya, gak ada niat jahat kok. Yaudah, yuk balik.',
      next: 'n6',
    },
    n6: {
      id: 'n6',
      speaker: 'rafi',
      text: 'Btw selamat datang ya. Semoga betah di sini.',
      // Node terakhir: tidak ada `next` -> DialogueBox menutup diri &
      // menandai quest selesai.
    },
  },
};
