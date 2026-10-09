import Phaser from 'phaser';
import { GameConfig } from './config.ts';
import { getPlatform } from './services/platform';

async function start() {
  await getPlatform().init();
  (window as unknown as { game: Phaser.Game }).game = new Phaser.Game(GameConfig); // для отладки/E2E-записи
}

start(); //#b10000
