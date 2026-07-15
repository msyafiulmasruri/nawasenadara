import BasePlayerScene from './BasePlayerScene';
import { getEpisodeById, EPISODES } from '../config/episodes';
import { completeEpisode } from '../utils/progressStore';
import { LEVEL_EDGE_MARGIN } from '../config/gameConfig';
import { pxToWorld, getVisibleBounds } from '../utils/visibleBounds';

// Dipakai sementara oleh episode 2-9 selagi background asli belum jadi.
// Begitu aset latar tersedia, cara menggantinya:
// 1. Buat file scene baru (contoh: Episode2Scene.js) meniru pola
//    Episode1Scene.js (extend BasePlayerScene, override createBackground
//    supaya load gambar asli lewat this.add.tileSprite/this.add.image).
// 2. Daftarkan scene baru itu di PhaserGame.jsx (array `scene`).
// 3. Ganti `sceneKey` episode terkait di config/episodes.js dari
//    'PlaceholderEpisodeScene' menjadi nama scene baru itu.
// Tidak ada bagian lain yang perlu diubah — EpisodeSelectScene,
// EpisodeIntroScene, dan progressStore semuanya baca dari episodes.js.
export default class PlaceholderEpisodeScene extends BasePlayerScene {
  constructor() {
    super('PlaceholderEpisodeScene');
  }

  init(data) {
    this.episodeId = data?.episodeId ?? 2;
    this.episodeData = getEpisodeById(this.episodeId);
    this.finished = false;
  }

  createBackground(width, height) {
    const hasRealArt =
      Boolean(this.episodeData?.bgKey) &&
      this.textures.exists(this.episodeData.bgKey);

    if (hasRealArt) {
      // --- Aset asli sudah terpasang: pakai LOGIKA PERSIS SAMA seperti
      // Episode1Scene.createBackground() (lihat komentar lengkap di
      // sana) — proporsional, tidak diregangkan/di-tile, lantai selalu
      // sinkron dengan groundY di kedua orientasi. Sengaja disalin
      // di sini (bukan dipanggil lewat helper bersama) supaya kalau
      // episode ini nanti "naik kelas" jadi Scene khusus sendiri
      // (Episode2Scene dst.), tinggal copy-paste utuh tanpa perlu
      // bongkar abstraksi apa pun.
      this._createRealBackground(width, height);
    } else {
      this._createPlaceholderColorBackground(width, height);
    }

    this.finished = false;
    this._createHudLabels(width, height);
  }

  _createRealBackground(width, height) {
    const key = this.episodeData.bgKey;
    const source = this.textures.get(key).getSourceImage();
    const scale = height / source.height;
    const naturalWidth = Math.round(source.width * scale);

    // Pola sama persis dengan Episode1Scene.createBackground() — lihat
    // komentar lengkap di sana. Satu jalur kode untuk semua orientasi:
    // gambar asli apa adanya, sisa celah kanan (kalau ada) diisi tile
    // kecil dari gambar yang sama, bukan diregangkan.
    this.levelWidth = Math.max(naturalWidth, width);

    this.bg = this.add.image(naturalWidth / 2, height / 2, key);
    this.bg.setDisplaySize(naturalWidth, height);
    this.bg.setDepth(0);

    const extraWidth = this.levelWidth - naturalWidth;
    if (extraWidth > 0) {
      const tile = this.add.tileSprite(
        naturalWidth + extraWidth / 2,
        height / 2,
        extraWidth,
        height,
        key,
      );
      tile.setTileScale(scale, scale);
      tile.setDepth(0);
    }
  }

  _createPlaceholderColorBackground(width, height) {
    const color = this.episodeData?.placeholderColor ?? 0x222222;

    // Warna polos dibentang sepanjang seluruh level (bukan cuma satu
    // layar), supaya tetap penuh menutupi layar sepanjang kamera pan
    // mengikuti karakter berjalan (lihat _updatePortraitCamera di
    // BasePlayerScene). Placeholder tidak punya art asli untuk dijaga
    // proporsinya, jadi cukup warna polos selebar this.levelWidth
    // (default LEVEL_WIDTH dari BasePlayerScene karena scene ini tidak
    // menimpanya kalau belum ada art).
    this.add
      .rectangle(
        this.levelWidth / 2,
        height / 2,
        this.levelWidth,
        height,
        color,
      )
      .setDepth(0);
  }

  _createHudLabels(width, height) {
    const bounds = getVisibleBounds(this);

    // Teks informasi ini di-scrollFactor(0) supaya diam di layar (HUD),
    // tidak ikut bergeser mengikuti kamera saat karakter berjalan.
    //
    // wordWrap WAJIB di sini — judul episode panjangnya bervariasi
    // (lihat config/episodes.js), jadi tanpa wordWrap judul yang
    // panjang akan meluber/ke-crop di portrait sempit. Font size juga
    // pakai pxToWorld() (px fisik) supaya konsisten & tidak meluber
    // saat transisi non-fullscreen <-> fullscreen — lihat catatan
    // panjang soal ini di EpisodeIntroScene.create().
    this.add
      .text(
        width / 2,
        60,
        `EPISODE ${this.episodeId} — ${this.episodeData?.title ?? ''}`,
        {
          fontFamily: '"Pixelify Sans", monospace',
          fontSize: `${pxToWorld(this, 16)}px`,
          color: '#ffffff',
          align: 'center',
          wordWrap: { width: bounds.width * 0.85 },
        },
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1);

    // Sub-label placeholder cuma ditampilkan kalau memang belum ada art
    // asli — begitu asetnya terpasang, keterangan "menunggu aset final"
    // ini otomatis hilang sendiri tanpa perlu ubah kode apa pun.
    const hasRealArt =
      Boolean(this.episodeData?.bgKey) &&
      this.textures.exists(this.episodeData.bgKey);
    if (!hasRealArt) {
      this.add
        .text(width / 2, 92, '(Background placeholder — menunggu aset final)', {
          fontFamily: 'monospace',
          fontSize: `${pxToWorld(this, 11)}px`,
          color: '#cccccc',
          align: 'center',
          wordWrap: { width: bounds.width * 0.85 },
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1);
    }

    this.add
      .text(width - 20, height - 20, 'Jalan ke kanan untuk lanjut ->', {
        fontFamily: 'monospace',
        fontSize: `${pxToWorld(this, 11)}px`,
        color: '#ffdd57',
        align: 'right',
        wordWrap: { width: bounds.width * 0.5 },
      })
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(1);
  }

  onSceneUpdate() {
    if (this.finished) return;
    if (this.player.x > this.levelWidth - LEVEL_EDGE_MARGIN) {
      this.finished = true;
      completeEpisode(this.episodeId);

      const isLastEpisode = this.episodeId >= EPISODES.length;
      if (isLastEpisode) {
        // Belum ada scene "tamat" khusus — untuk sementara kembali ke
        // daftar episode dulu.
        this.scene.start('EpisodeSelectScene');
      } else {
        this.scene.start('EpisodeIntroScene', {
          episodeId: this.episodeId + 1,
        });
      }
    }
  }
}
