// Penyimpanan progres SEMENTARA di localStorage. Ini bukan pengganti
// database — begitu backend/API progres sudah ada, ganti isi
// getCompletedEpisodes/completeEpisode di sini supaya baca-tulis ke
// server, tanpa perlu ubah scene manapun yang memanggilnya (EpisodeSelectScene,
// PlaceholderEpisodeScene, Episode1Scene semua cuma bergantung pada
// fungsi-fungsi ini, bukan ke localStorage secara langsung).

const STORAGE_KEY = 'nawasenadara_progress_v1';

function readRaw() {
  if (typeof window === 'undefined') return { completed: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || !Array.isArray(parsed.completed)) return { completed: [] };
    return parsed;
  } catch (e) {
    console.warn('Gagal membaca progres lokal, mulai dari awal.', e);
    return { completed: [] };
  }
}

function writeRaw(data) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Gagal menyimpan progres lokal.', e);
  }
}

export function getCompletedEpisodes() {
  return readRaw().completed;
}

// Episode 1 selalu terbuka. Episode lain terbuka kalau episode
// sebelumnya (id - 1) sudah pernah diselesaikan.
export function isEpisodeUnlocked(episodeId) {
  if (episodeId === 1) return true;
  return getCompletedEpisodes().includes(episodeId - 1);
}

export function completeEpisode(episodeId) {
  const data = readRaw();
  if (!data.completed.includes(episodeId)) {
    data.completed.push(episodeId);
    writeRaw(data);
  }
}

export function resetProgress() {
  writeRaw({ completed: [] });
}
