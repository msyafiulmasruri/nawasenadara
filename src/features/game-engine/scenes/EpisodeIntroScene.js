import Phaser from 'phaser';
import AudioManager from '../audio/AudioManager';
import { stopMenuBGM } from '../audio/menuAudio';
import { getSettings } from '../utils/settingsStore';
import { getEpisodeById } from '../config/episodes';
import { getVisibleBounds, syncGameSizeToOrientation, pxToWorld } from '../utils/visibleBounds';

export default class EpisodeIntroScene extends Phaser.Scene {
  constructor() {
    super('EpisodeIntroScene');
  }

  init(data) {
    this.episodeId = data?.episodeId ?? 1;
    this.episodeData = getEpisodeById(this.episodeId);
  }

  create() {
    // WAJIB dipanggil di awal — lihat dokumentasi lengkap di
    // syncGameSizeToOrientation() (utils/visibleBounds.js). Tanpa ini,
    // scene sebelumnya (episode landscape dengan lebar dinamis, mis.
    // 1650) bisa "membekas": scene ini menggambar dengan asumsi lebar
    // tetap 1280, menyisakan area kosong (hitam) tidak simetris di
    // kanan/kiri layar karena dunia game sebenarnya masih lebih lebar
    // dari yang digambar.
    const { width, height } = syncGameSizeToOrientation(this);

    // Musik tema menu berhenti di sini (bukan menunggu sampai gameplay
    // sungguhan mulai) — layar intro episode ini sekarang punya tema
    // sendiri yang beda nuansanya (lebih menegangkan/antisipatif).
    stopMenuBGM();
    this.audioManager = new AudioManager();
    this.audioManager.init();
    const savedSettings = getSettings();
    this.audioManager.setBGMVolume(savedSettings.bgmVolume);
    if (savedSettings.muted) this.audioManager.setMasterVolume(0);
    this.audioManager.startIntroBGM();
    this.events.once('shutdown', () => {
      this.audioManager?.destroy();
    });

    this.bgRect = this.add.rectangle(width / 2, height / 2, width, height, 0x05050f).setDepth(0);

    // Bintang-bintang kecil, posisi acak, tiap bintang berkedip dengan
    // kecepatan berbeda-beda supaya tidak terasa seragam/kaku.
    for (let i = 0; i < 80; i += 1) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.FloatBetween(1, 2.4);
      const star = this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.3, 1));
      star.setDepth(1);

      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.15, 0.4),
        duration: Phaser.Math.Between(1200, 3200),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
      });
    }

    const bounds0 = getVisibleBounds(this);

    // --- Ukuran font: PENTING pakai pxToWorld(), bukan angka world-unit
    // tetap ---
    // Portrait sekarang punya lebar dunia yang DINAMIS mengikuti rasio
    // layar (bisa serendah ~300-400 world unit di HP sempit — lihat
    // syncGameSizeToOrientation()). Font yang ditulis sebagai angka
    // world-unit tetap (mis. "40px" dulu) jadi punya UKURAN FISIK yang
    // berubah-ubah tergantung lebar dunia saat itu — di dunia sempit,
    // font 40 unit itu jadi proporsinya SANGAT besar dibanding lebar
    // layar (~40/330 ≈ 12% tinggi per karakter), gampang bikin judul
    // episode yang panjang meluber keluar layar / ke-crop. pxToWorld()
    // mengonversi ukuran CSS px FISIK yang diinginkan (konsisten di
    // semua perangkat) ke world-unit yang sesuai skala ENVELOP saat
    // ini — sama seperti yang sudah dipakai untuk tombol sentuh.
    const episodeLabelFont = pxToWorld(this, 34);
    const episodeTitleFont = pxToWorld(this, 22);
    const episodeDescFont = pxToWorld(this, 15);
    const promptFont = pxToWorld(this, 17);

    this.episodeLabel = this.add
      .text(width / 2, height * 0.32, `EPISODE ${this.episodeId}`, {
        fontFamily: '"Jersey 15", monospace',
        fontSize: `${episodeLabelFont}px`,
        color: '#ffdd57',
      })
      .setOrigin(0.5)
      .setDepth(2);

    // wordWrap WAJIB di sini — episodeTitle diisi dari data episode
    // (judulnya bervariasi panjangnya, mis. "Rahasia di Grup Kelas"),
    // sebelumnya TIDAK ADA wordWrap sama sekali di teks ini, jadi judul
    // yang lebih panjang dari lebar dunia portrait yang sempit pasti
    // meluber/ke-crop di kedua sisi. Ini penyebab utama keluhan "teks
    // kepotong saat portrait".
    this.episodeTitle = this.add
      .text(width / 2, height * 0.32 + 46, this.episodeData?.title ?? '', {
        fontFamily: '"Pixelify Sans", monospace',
        fontSize: `${episodeTitleFont}px`,
        fontStyle: '600',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: bounds0.width * 0.85 },
      })
      .setOrigin(0.5)
      .setDepth(2);

    // wordWrap pakai lebar area yang BENAR-BENAR terlihat (bukan lebar
    // dunia 1280 mentah) — supaya di layar portrait sempit yang
    // tepinya ke-crop mode ENVELOP, teks deskripsi tidak melebar
    // sampai ke area yang sudah tidak kelihatan.
    this.episodeDesc = this.add
      .text(width / 2, height * 0.55, this.episodeData?.description ?? '', {
        fontFamily: '"Pixelify Sans", monospace',
        fontSize: `${episodeDescFont}px`,
        color: '#dddddd',
        align: 'center',
        wordWrap: { width: bounds0.width * 0.85 },
        lineSpacing: 6,
      })
      .setOrigin(0.5)
      .setDepth(2);

    this.promptText = this.add
      .text(width / 2, height * 0.85, 'TEKAN UNTUK MULAI', {
        fontFamily: '"Pixelify Sans", monospace',
        fontSize: `${promptFont}px`,
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: bounds0.width * 0.85 },
      })
      .setOrigin(0.5)
      .setDepth(2);

    this.tweens.add({
      targets: this.promptText,
      alpha: 0,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    const startEpisode = () => {
      const sceneKey = this.episodeData?.sceneKey ?? 'Episode1Scene';
      this.scene.start(sceneKey, { episodeId: this.episodeId });
    };

    this.input.keyboard.once('keydown-SPACE', startEpisode);
    this.input.once('pointerdown', startEpisode);

    // Reposisi semua teks ke area yang benar-benar terlihat kalau
    // viewport berubah ukuran/orientasi saat masih di scene ini —
    // sebelumnya scene ini tidak punya listener resize sama sekali,
    // jadi kalau HP diputar di sini teks tetap di posisi/lebar lama.
    this._resizeDebounceTimer = null;
    this._onResize = () => {
      if (this._resizeDebounceTimer) clearTimeout(this._resizeDebounceTimer);
      this._resizeDebounceTimer = setTimeout(() => this._reposition(), 150);
    };
    this.scale.on('resize', this._onResize);
    this.events.once('shutdown', () => {
      if (this._resizeDebounceTimer) clearTimeout(this._resizeDebounceTimer);
      this.scale.off('resize', this._onResize);
    });
  }

  _reposition() {
    // Sync ulang juga di sini (bukan cuma di create()) — supaya kalau
    // rasio aspek berubah SAAT masih di scene ini (mis. user toggle
    // fullscreen persis waktu di layar intro episode — INI KASUS YANG
    // DIMINTA: "dari belum fullscreen hingga fullscreen tetap
    // responsive"), lebar dunia game ikut disesuaikan lagi, bukan cuma
    // teks-nya yang dipindah tapi background rectangle-nya tetap
    // ukuran lama (bekas lebar sebelumnya) dan menyisakan celah hitam
    // di tepi.
    const { width, height } = syncGameSizeToOrientation(this);
    this.bgRect?.setPosition(width / 2, height / 2);
    this.bgRect?.setSize(width, height);

    const bounds = getVisibleBounds(this);
    const baseY = bounds.top + bounds.height * 0.32;

    // Ukuran font DIHITUNG ULANG tiap resize (bukan cuma posisi) —
    // supaya transisi non-fullscreen <-> fullscreen (yang mengubah
    // skala ENVELOP secara signifikan) tetap menghasilkan ukuran teks
    // yang proporsional & tidak meluber, bukan cuma dipindah posisinya
    // saja dengan ukuran font basi dari render sebelumnya.
    this.episodeLabel?.setFontSize(pxToWorld(this, 34));
    this.episodeLabel?.setPosition(bounds.centerX, baseY);

    this.episodeTitle?.setFontSize(pxToWorld(this, 22));
    this.episodeTitle?.setPosition(bounds.centerX, baseY + 46);
    this.episodeTitle?.setWordWrapWidth(bounds.width * 0.85);

    this.episodeDesc?.setFontSize(pxToWorld(this, 15));
    this.episodeDesc?.setPosition(bounds.centerX, bounds.top + bounds.height * 0.55);
    this.episodeDesc?.setWordWrapWidth(bounds.width * 0.85);

    this.promptText?.setFontSize(pxToWorld(this, 17));
    this.promptText?.setPosition(bounds.centerX, bounds.top + bounds.height * 0.85);
    this.promptText?.setWordWrapWidth(bounds.width * 0.85);
  }
}
