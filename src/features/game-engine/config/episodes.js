// Data semua episode Nawasena Dara. `sceneKey` menunjuk ke Phaser Scene
// yang menjalankan episode itu. Episode 1 sudah punya scene sendiri
// (Episode1Scene, dulu bernama ClassroomScene). Episode 2-9 untuk
// sementara semuanya memakai PlaceholderEpisodeScene (background warna
// polos + label) sambil menunggu aset latar belakang final — begitu
// asetnya siap, tinggal buat Scene khusus per episode (seperti Episode1)
// dan ganti nilai sceneKey di sini, tidak perlu ubah bagian lain
// (EpisodeSelectScene, EpisodeIntroScene, progressStore semua otomatis
// ikut karena berbasis data ini).

export const EPISODES = [
  {
    id: 1,
    title: 'Awal yang Baru',
    sceneKey: 'Episode1Scene',
    placeholderColor: 0x2b2340,
    description:
      'Hari pertama di sekolah baru. Kamu berkenalan dengan teman-teman sekelas — sebagian ramah, sebagian melempar candaan yang terasa menusuk. Bagaimana kamu meresponsnya akan membentuk hubunganmu ke depan.',
  },
  {
    id: 2,
    title: 'Rahasia di Grup Kelas',
    sceneKey: 'PlaceholderEpisodeScene',
    placeholderColor: 0x243b55,
    description:
      'Saat istirahat, kamu menemukan salah satu teman sedang di-bully di grup chat kelas. Diam, membantu, atau justru ikut menyebarkan — pilihanmu akan membuka jalan cerita yang berbeda.',
  },
  {
    id: 3,
    title: 'Pesan dari Orang Asing',
    sceneKey: 'PlaceholderEpisodeScene',
    placeholderColor: 0x1f2937,
    description:
      'Malam itu, sebuah pesan dari akun tak dikenal masuk ke ponselmu. Awalnya terasa ramah, lalu perlahan berubah tidak nyaman. Kamu harus memutuskan cara meresponsnya sebelum semua terlambat.',
  },
  {
    id: 4,
    title: 'Candaan yang Tidak Nyaman',
    sceneKey: 'PlaceholderEpisodeScene',
    placeholderColor: 0x3a2e2e,
    description:
      'Di kantin yang ramai, komentar-komentar tentang tubuhmu terdengar dari meja seberang. Kamu harus melewati momen itu dan memutuskan: diam, menegur, atau mencari bantuan.',
  },
  {
    id: 5,
    title: 'Ketika Sahabat Berubah',
    sceneKey: 'PlaceholderEpisodeScene',
    placeholderColor: 0x234238,
    description:
      'Sahabatmu belakangan ini terlihat berbeda — lebih pendiam, sering menunduk. Kamu menghampirinya di taman belakang sekolah dan mencoba memahami apa yang sebenarnya terjadi.',
  },
  {
    id: 6,
    title: 'Berani Berkata Tidak',
    sceneKey: 'PlaceholderEpisodeScene',
    placeholderColor: 0x1a1a2e,
    description:
      'Di sebuah gang dekat rumah, kamu dihadapkan pada tekanan untuk melakukan sesuatu yang tidak kamu inginkan. Inilah saatnya melatih keberanian untuk berkata tidak.',
  },
  {
    id: 7,
    title: 'Mencari Tempat Aman',
    sceneKey: 'PlaceholderEpisodeScene',
    placeholderColor: 0x2e2b3f,
    description:
      'Di rumah, kamu akhirnya memutuskan untuk mencari bantuan. Telepon di meja punya beberapa pilihan kontak — orang tua, guru BK, atau layanan bantuan. Semua bisa jadi awal pemulihan.',
  },
  {
    id: 8,
    title: 'Suara untuk Diriku',
    sceneKey: 'PlaceholderEpisodeScene',
    placeholderColor: 0x3b3022,
    description:
      'Malam yang lebih tenang. Kamu menuliskan semua yang dirasakan di buku catatan pribadi, sebagai bagian dari proses pemulihan dan menemukan kembali kepercayaan diri.',
  },
  {
    id: 9,
    title: 'Langkah Baru',
    sceneKey: 'PlaceholderEpisodeScene',
    placeholderColor: 0x24344a,
    description:
      'Sekolah terasa berbeda sekarang. Kamu menjelajahi tempat-tempat yang pernah kamu lalui, bertemu lagi dengan wajah-wajah dari perjalanananmu, dan menutup kisah ini dengan caramu sendiri.',
  },
];

export function getEpisodeById(id) {
  return EPISODES.find((ep) => ep.id === id) ?? null;
}
