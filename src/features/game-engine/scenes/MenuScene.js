import Phaser from 'phaser';
import { startMenuBGM } from '../audio/menuAudio';
import { getSettings } from '../utils/settingsStore';
import { drawStarfieldBackground } from '../utils/starfieldBackground';
import { getVisibleBounds, syncGameSizeToOrientation, pxToWorld } from '../utils/visibleBounds';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    // WAJIB di awal — lihat dokumentasi di syncGameSizeToOrientation()
    // (utils/visibleBounds.js). Scene ini tidak menggambar rectangle
    // background sendiri, tapi posisi/hit-area menu tetap bergantung
    // pada getVisibleBounds() yang baca gameSize — kalau gameSize basi
    // (bekas scene episode landscape sebelumnya), menu bisa muncul
    // sedikit tidak center.
    const { width, height } = syncGameSizeToOrientation(this);
    const bounds0 = getVisibleBounds(this);

    // Background langit + bintang berkedip — konsisten dengan
    // TitleScene (sebelumnya scene ini benar-benar polos/hitam).
    this._starfield = drawStarfieldBackground(this, width, height);

    // Musik tema menu: idempotent (kalau sudah jalan dari TitleScene,
    // panggilan ini no-op). Kalau pemain baru saja KEMBALI dari
    // gameplay episode (di mana musik menu sempat dihentikan lewat
    // stopMenuBGM() di BasePlayerScene), panggilan ini yang menyalakannya
    // lagi.
    startMenuBGM(getSettings());
    const menuFont = pxToWorld(this, 22);
    const options = ['Start Story', 'Settings', 'Exit'];
    let selectedIndex = 0;

    const confirmSelection = () => {
      if (options[selectedIndex] === 'Start Story') {
        this.scene.start('EpisodeSelectScene');
      } else if (options[selectedIndex] === 'Settings') {
        this.scene.start('SettingsScene');
      } else if (options[selectedIndex] === 'Exit') {
        this._handleExit();
      }
    };

    const updateSelection = () => {
      this._menuTexts.forEach((text, i) => {
        text.setColor(i === selectedIndex ? '#ffdd57' : '#ffffff');
      });
    };

    // Ukuran font pakai pxToWorld() (px fisik) + wordWrap jaga-jaga —
    // lihat catatan lengkap soal ini di EpisodeIntroScene.create().
    this._menuTexts = options.map((label, i) =>
      this.add
        .text(width / 2, height / 2 + i * 40, label, {
          fontFamily: '"Pixelify Sans", monospace',
          fontSize: `${menuFont}px`,
          fontStyle: '600',
          color: i === 0 ? '#ffdd57' : '#ffffff',
          align: 'center',
          wordWrap: { width: bounds0.width * 0.9 },
        })
        .setOrigin(0.5)
        .setDepth(2)
        // Supaya tiap opsi bisa di-tap langsung lewat HP (atau diklik
        // mouse), bukan cuma dipilih lewat panah keyboard.
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          selectedIndex = i;
          updateSelection();
        })
        .on('pointerdown', () => {
          selectedIndex = i;
          updateSelection();
          confirmSelection();
        }),
    );

    this.input.keyboard.on('keydown-DOWN', () => {
      selectedIndex = (selectedIndex + 1) % options.length;
      updateSelection();
    });

    this.input.keyboard.on('keydown-UP', () => {
      selectedIndex = (selectedIndex - 1 + options.length) % options.length;
      updateSelection();
    });

    this.input.keyboard.on('keydown-ENTER', confirmSelection);

    // Sebelumnya scene ini sama sekali tidak punya listener resize.
    // Item menu ditaruh di tengah dunia (width/2), yang secara
    // horizontal biasanya tetap aman dari crop mode ENVELOP karena
    // selalu berada di centerX — TAPI hit area interaktif teks tidak
    // ikut di-refresh setelah rotasi/resize, dan posisi vertikal
    // idealnya tetap mengacu ke centerY area yang benar-benar
    // terlihat, bukan height/2 dunia mentah. Ditambahkan supaya
    // konsisten dengan scene lain dan mencegah tombol "tidak
    // terklik" setelah ganti orientasi.
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

    this._reposition();
  }

  // "Exit" di game web bukan menutup aplikasi (tidak ada konsep itu di
  // browser), tapi keluar dari SESI AKUN — logout, lalu kembali ke
  // halaman login. Logout sebenarnya (hapus cookie refresh token +
  // panggil POST /api/auth/logout) dilakukan lewat AuthContext di sisi
  // React, dijembatani ke Phaser lewat window.__nawasenadaraAuth (lihat
  // features/auth/components/GameAuthBridge.jsx yang dipasang di
  // app/game/page.js).
  _handleExit() {
    if (this._exiting) return;
    this._exiting = true;

    const exitLabel = this._menuTexts[2];
    exitLabel?.setText('Logging out…');
    exitLabel?.setColor('#ffdd57');

    const bridge = typeof window !== 'undefined' ? window.__nawasenadaraAuth : null;
    const goToLogin = () => {
      if (typeof window !== 'undefined') window.location.href = '/login';
    };

    if (bridge?.logout) {
      bridge
        .logout()
        .catch(() => {
          // Tetap arahkan ke /login walau request logout ke server
          // gagal (mis. jaringan putus) — sesi lokal (access token di
          // memori React) tetap dibersihkan oleh AuthContext.logout().
        })
        .finally(goToLogin);
    } else {
      // Bridge belum siap (kasus langka) — tetap arahkan ke /login,
      // yang otomatis akan minta login ulang.
      goToLogin();
    }
  }

  _reposition() {
    const { width, height } = syncGameSizeToOrientation(this);
    this._starfield?.reposition(width, height);
    const bounds = getVisibleBounds(this);
    const font = pxToWorld(this, 22);
    this._menuTexts?.forEach((text, i) => {
      text.setPosition(bounds.centerX, bounds.centerY + (i - (this._menuTexts.length - 1) / 2) * 44);
      text.setFontSize(font);
      text.setWordWrapWidth(bounds.width * 0.9);
      // Refresh hit area setiap resize — sama seperti tombol sentuh di
      // BasePlayerScene, Phaser tidak otomatis mensinkronkan hit area
      // lama dengan posisi/ukuran baru objek setelah scale berubah.
      text.disableInteractive();
      text.setInteractive({ useHandCursor: true });
    });
  }
}
