import sharp from 'sharp';
import fs from 'fs';

const input = 'assets/new_logo.jpg';

async function generate() {
  await sharp(input).resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).png().toFile('assets/icon.png');
  await sharp(input).resize(2732, 2732, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).png().toFile('assets/splash.png');

  await sharp(input).resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).png().toFile('public/favicon.ico');
  await sharp(input).png().toFile('public/splash-branding.png');
  await sharp(input).jpeg().toFile('src/assets/splash.jpg');

  const sizes = [48, 72, 96, 128, 192, 256, 512];
  for (const size of sizes) {
      await sharp(input).resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).webp().toFile('public/icons/icon-' + size + '.webp');
  }
  console.log('Images generated!');
}

generate().catch(console.error);
