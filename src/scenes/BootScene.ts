import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    // Полоса загрузки — модерация любит, когда не чёрный экран
    const cx = 360, cy = 640;
    const title = this.add.text(cx, cy - 90, '⛏️ Загрузка шахты…', {
      fontSize: '24px', color: '#f1c40f', fontStyle: 'bold'
    }).setOrigin(0.5);
    const barBg = this.add.rectangle(cx, cy, 420, 24, 0x2c3e50).setStrokeStyle(2, 0x4a5a6a);
    const bar = this.add.rectangle(cx - 210, cy, 1, 20, 0xf1c40f).setOrigin(0, 0.5);
    const pct = this.add.text(cx, cy + 40, '0%', { fontSize: '16px', color: '#9fb2c0' }).setOrigin(0.5);
    this.load.on('progress', (v: number) => {
      bar.width = Math.max(1, 420 * v);
      pct.setText(`${Math.round(v * 100)}%`);
    });
    this.load.on('complete', () => { bar.destroy(); barBg.destroy(); pct.destroy(); title.destroy(); });

    // Загружаем звук клика и фоновую музыку из public/assets/
    this.load.audio('click', 'assets/click.mp3');
    this.load.audio('bgm', 'assets/bgm.mp3');
    // boss.mp3 грузится лениво в GameScene (fetch-проверка — иначе 404 бросает ошибку декодирования)
  }

  create(): void {
    this.scene.start('GameScene');
  }
}