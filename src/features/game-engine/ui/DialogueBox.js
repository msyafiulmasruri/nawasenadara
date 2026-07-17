import Phaser from 'phaser';
import { getVisibleBounds, pxToWorld } from '../utils/visibleBounds';

// Dialog box gaya "Harvest Moon: Back to Nature" — label nama
// pembicara menempel di atas kotak teks, dan (kalau node dialog itu
// punya percabangan) daftar pilihan jawaban tampil di bagian paling
// bawah kartu itu.
//
// Murni Phaser (bukan overlay React) — sama seperti pause menu /
// settings di BasePlayerScene — supaya gampang diposisikan RELATIF ke
// NPC yang ada di dunia game & tidak perlu sinkronisasi tambahan
// dengan lapisan DOM.
//
// Pemakaian (lihat Episode1Scene.js):
//   this.dialogueBox = new DialogueBox(this);
//   this.dialogueBox.open({
//     dialogueTree: EPISODE1_DIALOGUE,
//     npcPortraitKey: 'npc-rafi-portrait',
//     npcName: 'Rafi',
//     playerName: 'Sekar',
//     onClose: (collectedChoices) => { ... lanjutkan quest ... },
//   });
//
// --- CATATAN PERBAIKAN BUG (dialog "tidak ada ujungnya" / hilang
// cuma dengan spasi / tidak bisa disentuh di mobile) ---------------
// Root cause-nya ada 2 hal yang saling bertumpuk:
//
// 1. TAP/KLIK/KEY YANG SAMA yang dipakai untuk MEMBUKA dialog (mis.
//    tap ke sprite NPC) bisa "bocor" ke listener advance yang baru
//    saja dipasang di frame yang SAMA (Phaser memproses banyak
//    interactive object untuk satu event pointerdown di frame yang
//    sama) — hasilnya, node pertama langsung ke-advance/close
//    seketika itu juga, terasa seperti "dialog kebuka terus ketutup
//    lagi" atau "hilang cuma dengan sekali pencet". FIX: setiap kali
//    node baru dirender, ada jeda singkat (NODE_INPUT_GUARD_MS) di
//    mana input APA PUN diabaikan dulu — lihat _isInputReady().
//
// 2. Dulu hanya AREA KOTAK TEKS (satu rectangle) yang interactive
//    untuk tap-to-advance — di sebagian device/rasio layar, area itu
//    tidak selalu match dengan area yang bisa disentuh jari (hit-area
//    meleset), jadi mobile terasa "cuma bisa lewat tombol E". FIX:
//    sekarang tap DI MANA SAJA di layar (scene.input, bukan cuma satu
//    rectangle) akan meng-advance node non-percabangan — jauh lebih
//    toleran terhadap device apa pun, persis pola "tap anywhere to
//    continue" di visual novel pada umumnya.
const NODE_INPUT_GUARD_MS = 260;

export default class DialogueBox {
  constructor(scene) {
    this.scene = scene;
    this.isOpen = false;
    this._collectedChoices = [];
    this._container = null;
    this._choiceObjects = [];
    this._advanceKeyHandler = null;
    this._advancePointerHandler = null;
    this._nodeReadyAt = 0;
  }

  open({ dialogueTree, npcPortraitKey, npcName, playerName, onClose }) {
    if (this.isOpen) return;
    this.isOpen = true;
    this._dialogueTree = dialogueTree;
    this._npcPortraitKey = npcPortraitKey;
    this._npcName = npcName;
    this._playerName = playerName || 'Kamu';
    this._onClose = onClose;
    this._collectedChoices = [];

    this._buildStaticFrame();
    this._renderNode(dialogueTree.startNode);

    this.scene.scale.on('resize', this._onResize, this);

    // FIX (bug "Cannot read properties of undefined (reading 'sys')"):
    // kalau scene ini TIBA-TIBA di-shutdown SAAT dialog masih terbuka
    // (mis. pemain buka menu jeda lewat ESC di tengah ngobrol lalu
    // pilih "Mulai Ulang dari Awal" / "Pilih Episode" — lihat juga fix
    // di BasePlayerScene yang sekarang mencegah menu jeda dibuka saat
    // dialog aktif, tapi ini jaring pengaman lapis kedua), close() TIDAK
    // PERNAH sempat terpanggil secara normal. Akibatnya listener
    // `scale.on('resize', ...)` di atas — yang terpasang di
    // ScaleManager GLOBAL (bukan per-scene) — tetap nyangkut, terus
    // mereferensikan scene LAMA yang sudah dihancurkan. Begitu ada
    // event resize berikutnya (buka scene lain, ganti orientasi, dst),
    // listener basi itu tetap terpanggil dan mencoba this.scene.add.xxx
    // pada scene yang systems-nya sudah tidak ada → error "reading
    // 'sys' of undefined". Dengan mendaftarkan close() juga ke event
    // 'shutdown' scene ini, dialog SELALU ditutup bersih (listener
    // ikut lepas) apapun penyebab scene-nya berhenti.
    // FIX (bug "Cannot read properties of undefined (reading 'sys')"):
    // kalau scene ini TIBA-TIBA di-shutdown SAAT dialog masih terbuka
    // (mis. pemain buka menu jeda lewat ESC di tengah ngobrol lalu
    // pilih "Mulai Ulang dari Awal" / "Pilih Episode" — lihat juga fix
    // di BasePlayerScene yang sekarang mencegah menu jeda dibuka saat
    // dialog aktif, tapi ini jaring pengaman lapis kedua), close() TIDAK
    // PERNAH sempat terpanggil secara normal. Akibatnya listener
    // `scale.on('resize', ...)` di atas — yang terpasang di
    // ScaleManager GLOBAL (bukan per-scene) — tetap nyangkut, terus
    // mereferensikan scene LAMA yang sudah dihancurkan. Begitu ada
    // event resize berikutnya (buka scene lain, ganti orientasi, dst),
    // listener basi itu tetap terpanggil dan mencoba this.scene.add.xxx
    // pada scene yang systems-nya sudah tidak ada → error "reading
    // 'sys' of undefined". Dengan mendaftarkan close(true) juga ke
    // event 'shutdown' scene ini, dialog SELALU ditutup bersih
    // (listener ikut lepas) apapun penyebab scene-nya berhenti — TANPA
    // menjalankan efek samping onClose (mis. tawaran ngobrol Kak Dara)
    // yang cuma masuk akal kalau dialog ditutup secara NORMAL, bukan
    // gara-gara pemain pindah scene paksa.
    this._shutdownHandler = () => this.close(true);
    this.scene.events.once('shutdown', this._shutdownHandler);
  }

  close(silent = false) {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.scene.scale.off('resize', this._onResize, this);
    if (this._shutdownHandler) {
      this.scene.events.off('shutdown', this._shutdownHandler);
      this._shutdownHandler = null;
    }
    this._destroyChoiceObjects();
    this._detachAdvanceInput();
    this._container?.destroy();
    this._container = null;
    const choices = this._collectedChoices;
    if (!silent) this._onClose?.(choices);
  }

  // Selama NODE_INPUT_GUARD_MS pertama setelah sebuah node dirender,
  // input (tap/klik/keyboard) diabaikan — mencegah tap/tekan yang SAMA
  // yang membuka dialog ini ikut ke-hitung sebagai "lanjut" pada frame
  // yang sama juga (lihat catatan panjang di atas kelas ini).
  _isInputReady() {
    return this.scene.time.now >= this._nodeReadyAt;
  }

  // --- Kerangka kartu (label nama + kotak teks) — dibangun sekali
  // saat open(), lalu isinya (teks & pilihan) di-refresh per node
  // lewat _renderNode() tanpa membangun ulang kerangkanya.
  _buildStaticFrame() {
    const scene = this.scene;
    const bounds = getVisibleBounds(scene);

    const cardWidth = Math.min(bounds.width * 0.92, 640);
    const cardX = bounds.centerX;
    const cardTop = bounds.top + bounds.height * 0.08;

    this._container = scene.add.container(0, 0).setDepth(500).setScrollFactor(0);

    // --- Label nama pembicara, menempel tepat di atas kotak teks
    // (seperti tab kecil) ---
    const nameFont = pxToWorld(scene, 16);
    this._nameTagBg = scene.add
      .rectangle(cardX - cardWidth / 2 + 4, cardTop, 0, nameFont + 14, 0x243b55, 0.95)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xffdd57, 0.85);
    this._container.add(this._nameTagBg);

    this._nameTag = scene.add
      .text(cardX - cardWidth / 2 + 16, cardTop + 7, this._npcName, {
        fontFamily: '"Jersey 15", monospace',
        fontSize: `${nameFont}px`,
        color: '#ffdd57',
      })
      .setOrigin(0, 0);
    this._container.add(this._nameTag);

    // --- Kotak teks obrolan, MENEMPEL di bawah label nama ---
    const textBoxTop = cardTop + nameFont + 14 + 4;
    const textBoxHeight = Math.min(bounds.height * 0.22, 140);
    this._textBoxTop = textBoxTop;
    this._textBoxHeight = textBoxHeight;
    this._cardX = cardX;
    this._cardWidth = cardWidth;

    this._textBoxBg = scene.add
      .rectangle(cardX, textBoxTop + textBoxHeight / 2, cardWidth, textBoxHeight, 0x0f0f22, 0.95)
      .setStrokeStyle(2, 0xffdd57, 0.6);
    this._container.add(this._textBoxBg);

    const dialogueFont = pxToWorld(scene, 15);
    this._dialogueText = scene.add
      .text(cardX - cardWidth / 2 + 16, textBoxTop + 14, '', {
        fontFamily: '"Pixelify Sans", monospace',
        fontSize: `${dialogueFont}px`,
        color: '#ffffff',
        wordWrap: { width: cardWidth - 32 },
        lineSpacing: 4,
      })
      .setOrigin(0, 0);
    this._container.add(this._dialogueText);

    const hintFont = pxToWorld(scene, 11);
    this._advanceHint = scene.add
      .text(cardX + cardWidth / 2 - 14, textBoxTop + textBoxHeight - 10, '[E] / Ketuk layar ▸', {
        fontFamily: '"Pixelify Sans", monospace',
        fontSize: `${hintFont}px`,
        color: '#aaaaaa',
      })
      .setOrigin(1, 1);
    this._container.add(this._advanceHint);

    this._choicesStartY = textBoxTop + textBoxHeight + 12;
  }

  _substitute(text) {
    return text.replace(/\{PLAYER_NAME\}/g, this._playerName);
  }

  _renderNode(nodeId) {
    const node = this._dialogueTree.nodes[nodeId];
    if (!node) {
      this.close();
      return;
    }
    this._currentNode = node;
    // Blokir input sekejap supaya tap/tekan yang barusan memicu
    // render node ini tidak ikut ke-hitung sebagai "lanjut".
    this._nodeReadyAt = this.scene.time.now + NODE_INPUT_GUARD_MS;

    this._nameTag.setText(node.speaker === 'player' ? this._playerName : this._npcName);
    this._nameTagBg.setSize(this._nameTag.width + 24, this._nameTag.height + 14);
    this._dialogueText.setText(this._substitute(node.text));

    this._destroyChoiceObjects();
    this._detachAdvanceInput();

    if (Array.isArray(node.choices) && node.choices.length > 0) {
      this._advanceHint.setVisible(false);
      this._renderChoices(node.choices);
      // Node bercabang TIDAK bisa di-skip dengan E/Space/tap sembarang
      // — pemain wajib menekan salah satu pilihan (memilih respons
      // emosional itu sendiri adalah inti quest-nya).
    } else {
      // Node terakhir (tanpa `next`) TETAP butuh satu kali
      // tap/E/Space untuk ditutup — supaya pemain sempat membaca baris
      // penutupnya dulu, bukan otomatis hilang sendiri.
      this._advanceHint.setVisible(true);
      this._attachAdvanceInput(() => this._goToNext(node.next));
    }
  }

  _goToNext(nextId) {
    if (!nextId) {
      this.close();
      return;
    }
    this._renderNode(nextId);
  }

  _renderChoices(choices) {
    const scene = this.scene;
    const btnFont = pxToWorld(scene, 14);
    const btnHeight = pxToWorld(scene, 34);
    const gap = 8;

    choices.forEach((choice, i) => {
      const y = this._choicesStartY + i * (btnHeight + gap);
      const bg = scene.add
        .rectangle(this._cardX, y + btnHeight / 2, this._cardWidth, btnHeight, 0x243b55, 0.95)
        .setStrokeStyle(1.5, 0xffdd57, 0.5)
        .setInteractive({ useHandCursor: true });
      const label = scene.add
        .text(this._cardX - this._cardWidth / 2 + 14, y + btnHeight / 2, `${i + 1}. ${choice.label}`, {
          fontFamily: '"Pixelify Sans", monospace',
          fontSize: `${btnFont}px`,
          color: '#ffffff',
          wordWrap: { width: this._cardWidth - 28 },
        })
        .setOrigin(0, 0.5);

      bg.on('pointerover', () => bg.setFillStyle(0x2f4d73, 0.95));
      bg.on('pointerout', () => bg.setFillStyle(0x243b55, 0.95));
      bg.on('pointerdown', () => {
        if (!this._isInputReady()) return;
        this._selectChoice(choice);
      });

      this._container.add(bg);
      this._container.add(label);
      this._choiceObjects.push(bg, label);
    });

    // Keyboard 1-9 untuk memilih (dibatasi jumlah choices).
    this._choiceKeyHandler = (event) => {
      if (!this._isInputReady()) return;
      const num = Number(event.key);
      if (num >= 1 && num <= choices.length) {
        this._selectChoice(choices[num - 1]);
      }
    };
    scene.input.keyboard.on('keydown', this._choiceKeyHandler);
  }

  _selectChoice(choice) {
    this._collectedChoices.push({
      nodeId: this._currentNode.id,
      choiceId: choice.id,
      scoreKey: choice.scoreKey,
    });
    if (this._choiceKeyHandler) {
      this.scene.input.keyboard.off('keydown', this._choiceKeyHandler);
      this._choiceKeyHandler = null;
    }
    this._goToNext(choice.next);
  }

  _destroyChoiceObjects() {
    this._choiceObjects.forEach((obj) => obj.destroy());
    this._choiceObjects = [];
    if (this._choiceKeyHandler) {
      this.scene.input.keyboard.off('keydown', this._choiceKeyHandler);
      this._choiceKeyHandler = null;
    }
  }

  // Dipasang untuk node LINEAR (tanpa percabangan): E, Space, DAN tap
  // di mana saja di layar (bukan cuma satu rectangle) — supaya mobile
  // tidak bergantung ke hit-area yang presisi. Semua jalur dijaga oleh
  // _isInputReady() supaya tap/tekan yang baru saja membuka node ini
  // tidak ikut memicu advance di frame yang sama (lihat catatan bug di
  // atas kelas).
  _attachAdvanceInput(handler) {
    this._detachAdvanceInput();

    const guardedHandler = () => {
      if (!this._isInputReady()) return;
      handler();
    };
    this._advanceKeyHandler = guardedHandler;
    this._advancePointerHandler = guardedHandler;

    this.scene.input.keyboard.on('keydown-E', guardedHandler);
    this.scene.input.keyboard.on('keydown-SPACE', guardedHandler);
    this.scene.input.on('pointerdown', guardedHandler);
  }

  _detachAdvanceInput() {
    if (this._advanceKeyHandler) {
      this.scene.input.keyboard.off('keydown-E', this._advanceKeyHandler);
      this.scene.input.keyboard.off('keydown-SPACE', this._advanceKeyHandler);
      this._advanceKeyHandler = null;
    }
    if (this._advancePointerHandler) {
      this.scene.input.off('pointerdown', this._advancePointerHandler);
      this._advancePointerHandler = null;
    }
  }

  _onResize() {
    if (!this.isOpen) return;
    const currentNodeId = this._currentNode?.id;
    this._destroyChoiceObjects();
    this._detachAdvanceInput();
    this._container?.destroy();
    this._buildStaticFrame();
    this._renderNode(currentNodeId ?? this._dialogueTree.startNode);
  }
}
