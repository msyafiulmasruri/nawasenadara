import BasePlayerScene from './BasePlayerScene';
import { completeEpisode } from '../utils/progressStore';
import { LEVEL_EDGE_MARGIN } from '../config/gameConfig';

// Episode 1 - Awal yang Baru.
export default class Episode1Scene extends BasePlayerScene {
  constructor() {
    super('Episode1Scene');
  }

  // Satu jalur kode untuk SEMUA orientasi (dulu portrait & landscape
  // punya cabang kode terpisah — disatukan supaya perilakunya konsisten
  // dan gampang dirawat):
  //
  // 1. Background asli ditampilkan APA ADANYA, proporsional (scale
  //    dihitung dari tinggi asli gambar supaya tinggi render PERSIS
  //    `height`), TIDAK diregangkan/didistorsi sama sekali.
  // 2. this.levelWidth = lebar asli gambar itu (naturalWidth), KECUALI
  //    kalau layar saat ini lebih lebar dari gambar aslinya (mis. layar
  //    landscape ultra-lebar) — dalam kasus itu, sisa celah di kanan
  //    diisi TILE KECIL dari gambar yang sama (bukan diregangkan),
  //    supaya tidak ada area kosong dan levelWidth tetap >= lebar layar.
  // 3. Kamera (_updatePortraitCamera di BasePlayerScene, sekarang
  //    berlaku universal) otomatis diam kalau levelWidth <= lebar layar
  //    (level sudah muat penuh), dan otomatis mulai mem-pan begitu
  //    karakter mendekati tepi kalau levelWidth lebih lebar — jadi tidak
  //    perlu logic kamera terpisah untuk portrait vs landscape lagi.
  createBackground(width, height) {
    this.finished = false;

    const source = this.textures.get('episode1-bg').getSourceImage();
    const scale = height / source.height;
    const naturalWidth = Math.round(source.width * scale);

    // Level minimal selebar layar saat ini, supaya karakter selalu
    // punya ruang jalan yang penuh terlihat di layar manapun.
    this.levelWidth = Math.max(naturalWidth, width);

    // Gambar asli, mulai persis dari x=0 (tepi kiri) — TIDAK
    // diregangkan, TIDAK di-tile untuk bagian ini.
    this.bg = this.add.image(naturalWidth / 2, height / 2, 'episode1-bg');
    this.bg.setDisplaySize(naturalWidth, height);
    this.bg.setDepth(0);

    // Kalau layar lebih lebar dari gambar aslinya, isi SISA celah di
    // kanan (dari x=naturalWidth sampai x=levelWidth) dengan tile kecil
    // dari gambar yang sama, supaya tidak ada area kosong dan karakter
    // tetap punya sesuatu untuk dijalani sampai levelWidth.
    const extraWidth = this.levelWidth - naturalWidth;
    if (extraWidth > 0) {
      const tile = this.add.tileSprite(
        naturalWidth + extraWidth / 2,
        height / 2,
        extraWidth,
        height,
        'episode1-bg',
      );
      tile.setTileScale(scale, scale);
      tile.setDepth(0);
    }
  }

  // Zona "selesai episode": jalan sampai ke ujung kanan level.
  // this.levelWidth otomatis menyesuaikan (lebar gambar asli, atau
  // ditambah tile kecil kalau layar lebih lebar), jadi kondisi ini
  // tidak perlu berubah apa pun untuk orientasi manapun.
  onSceneUpdate() {
    if (this.finished) return;
    if (this.player.x > this.levelWidth - LEVEL_EDGE_MARGIN) {
      this.finished = true;
      completeEpisode(1);
      this.scene.start('EpisodeIntroScene', { episodeId: 2 });
    }
  }
}
