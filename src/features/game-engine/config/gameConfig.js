// Resolusi dasar "dunia" game — TIDAK berubah walau layar di-resize atau
// browser di-zoom. Mode scale ENVELOP (lihat PhaserGame.jsx) yang akan
// membesarkan/mengecilkan tampilan kanvas via CSS supaya selalu menutupi
// layar penuh, sementara koordinat di dalam game tetap konsisten di
// angka ini. Ini yang mencegah karakter ikut mengecil saat browser
// di-zoom out (bug sebelumnya terjadi karena world ikut berubah ukuran
// mengikuti ukuran viewport).
export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 720;
