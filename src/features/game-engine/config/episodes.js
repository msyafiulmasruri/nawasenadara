// Data semua episode Nawasena Dara. `sceneKey` menunjuk ke Phaser Scene
// yang menjalankan episode itu. Episode 1 sudah punya scene sendiri
// (Episode1Scene, dulu bernama ClassroomScene). Episode 2-9 untuk
// sementara semuanya memakai PlaceholderEpisodeScene (background warna
// polos + label) sambil menunggu aset latar belakang final.
//
// CARA PASANG ASET BACKGROUND EPISODE 2-9 NANTI (tanpa ubah kode sama
// sekali di luar file ini + BootScene):
// 1. Taruh file gambarnya di public/scenes/, ikuti pola nama yang sudah
//    disiapkan di `bgImagePath` tiap episode di bawah (mis.
//    /scenes/episode-2-bg.png).
// 2. Itu saja — BootScene sudah mencoba me-load semua path ini dari
//    awal (aman kalau filenya belum ada, cuma di-skip diam-diam), dan
//    PlaceholderEpisodeScene otomatis mendeteksi textur mana yang
//    berhasil dimuat (`this.textures.exists(bgKey)`) lalu menampilkan
//    gambar itu dengan logika portrait/landscape PERSIS SAMA seperti
//    Episode1Scene (proporsional, tidak diregangkan/di-tile, lantai
//    tetap sinkron dengan groundY). Kalau belum ada gambarnya, otomatis
//    fallback ke warna polos (placeholderColor) seperti sekarang.
// 3. Kalau episode tertentu nanti butuh logic KHUSUS (bukan cuma ganti
//    background, mis. ada NPC/dialog/puzzle unik), baru saat itu buat
//    Scene khusus sendiri (contoh: Episode2Scene.js meniru pola
//    Episode1Scene.js), daftarkan di PhaserGame.jsx, lalu ganti
//    sceneKey di bawah dari 'PlaceholderEpisodeScene' ke nama scene
//    barunya. EpisodeSelectScene, EpisodeIntroScene, dan progressStore
//    semuanya baca dari episodes.js ini, jadi tidak ada bagian lain
//    yang perlu diubah.

export const EPISODES = [
  {
    id: 1,
    title: 'Awal yang Baru',
    sceneKey: 'Episode1Scene',
    placeholderColor: 0x2b2340,
    bgKey: 'episode1-bg',
    bgImagePath: '/scenes/episode-1-corridor.png',
    description:
      'Hari pertama di sekolah baru. Kamu berkenalan dengan teman-teman sekelas — sebagian ramah, sebagian melempar candaan yang terasa menusuk. Bagaimana kamu meresponsnya akan membentuk hubunganmu ke depan.',
  },
  {
    id: 2,
    title: 'Rahasia di Grup Kelas',
    sceneKey: 'PlaceholderEpisodeScene',
    placeholderColor: 0x243b55,
    bgKey: 'episode2-bg',
    bgImagePath: '/scenes/episode-2-bg.png',
    description:
      'Saat istirahat, kamu menemukan salah satu teman sedang di-bully di grup chat kelas. Diam, membantu, atau justru ikut menyebarkan — pilihanmu akan membuka jalan cerita yang berbeda.',
  },
  {
    id: 3,
    title: 'Pesan dari Orang Asing',
    sceneKey: 'PlaceholderEpisodeScene',
    placeholderColor: 0x1f2937,
    bgKey: 'episode3-bg',
    bgImagePath: '/scenes/episode-3-bg.png',
    description:
      'Malam itu, sebuah pesan dari akun tak dikenal masuk ke ponselmu. Awalnya terasa ramah, lalu perlahan berubah tidak nyaman. Kamu harus memutuskan cara meresponsnya sebelum semua terlambat.',
  },
  {
    id: 4,
    title: 'Candaan yang Tidak Nyaman',
    sceneKey: 'PlaceholderEpisodeScene',
    placeholderColor: 0x3a2e2e,
    bgKey: 'episode4-bg',
    bgImagePath: '/scenes/episode-4-bg.png',
    description:
      'Di kantin yang ramai, komentar-komentar tentang tubuhmu terdengar dari meja seberang. Kamu harus melewati momen itu dan memutuskan: diam, menegur, atau mencari bantuan.',
  },
  {
    id: 5,
    title: 'Ketika Sahabat Berubah',
    sceneKey: 'PlaceholderEpisodeScene',
    placeholderColor: 0x234238,
    bgKey: 'episode5-bg',
    bgImagePath: '/scenes/episode-5-bg.png',
    description:
      'Sahabatmu belakangan ini terlihat berbeda — lebih pendiam, sering menunduk. Kamu menghampirinya di taman belakang sekolah dan mencoba memahami apa yang sebenarnya terjadi.',
  },
  {
    id: 6,
    title: 'Berani Berkata Tidak',
    sceneKey: 'PlaceholderEpisodeScene',
    placeholderColor: 0x1a1a2e,
    bgKey: 'episode6-bg',
    bgImagePath: '/scenes/episode-6-bg.png',
    description:
      'Di sebuah gang dekat rumah, kamu dihadapkan pada tekanan untuk melakukan sesuatu yang tidak kamu inginkan. Inilah saatnya melatih keberanian untuk berkata tidak.',
  },
  {
    id: 7,
    title: 'Mencari Tempat Aman',
    sceneKey: 'PlaceholderEpisodeScene',
    placeholderColor: 0x2e2b3f,
    bgKey: 'episode7-bg',
    bgImagePath: '/scenes/episode-7-bg.png',
    description:
      'Di rumah, kamu akhirnya memutuskan untuk mencari bantuan. Telepon di meja punya beberapa pilihan kontak — orang tua, guru BK, atau layanan bantuan. Semua bisa jadi awal pemulihan.',
  },
  {
    id: 8,
    title: 'Suara untuk Diriku',
    sceneKey: 'PlaceholderEpisodeScene',
    placeholderColor: 0x3b3022,
    bgKey: 'episode8-bg',
    bgImagePath: '/scenes/episode-8-bg.png',
    description:
      'Malam yang lebih tenang. Kamu menuliskan semua yang dirasakan di buku catatan pribadi, sebagai bagian dari proses pemulihan dan menemukan kembali kepercayaan diri.',
  },
  {
    id: 9,
    title: 'Langkah Baru',
    sceneKey: 'PlaceholderEpisodeScene',
    placeholderColor: 0x24344a,
    bgKey: 'episode9-bg',
    bgImagePath: '/scenes/episode-9-bg.png',
    description:
      'Sekolah terasa berbeda sekarang. Kamu menjelajahi tempat-tempat yang pernah kamu lalui, bertemu lagi dengan wajah-wajah dari perjalanananmu, dan menutup kisah ini dengan caramu sendiri.',
  },
];

export function getEpisodeById(id) {
  return EPISODES.find((ep) => ep.id === id) ?? null;
}
