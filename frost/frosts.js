import { CONFIG } from './consts.js';

export class Frost {
  constructor(angle, radius, frostImage) {
    this.angle = angle;
    this.radius = radius;

    this.image = frostImage;
    this.size = Math.random() * 60 + 60;
    this.opacity = Math.random() * 0.5 + 0.3; // 避免太透明
    this.isDestroyed = false;
  }

  update(deltaTime) {
    if (this.isDestroyed) {
      this.opacity -= 1.5 * deltaTime; // 被擦掉后慢慢变透明
      if (this.opacity < 0) this.opacity = 0;
    }
  }

  draw(ctx) {
    let centerX = CONFIG.VIDEO_WIDTH / 2;
    let centerY = CONFIG.VIDEO_HEIGHT / 2;
    const x = centerX + Math.cos(this.angle) * this.radius;
    const y = centerY + Math.sin(this.angle) * this.radius;

    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.drawImage(
      this.image,
      x - this.size / 2,
      y - this.size / 2,
      this.size,
      this.size
    );
    ctx.restore();
  }

  interactWithNose(noseX, noseY, interactionDistance) {
    let centerX = CONFIG.VIDEO_WIDTH / 2;
    let centerY = CONFIG.VIDEO_HEIGHT / 2;
    const x = centerX + Math.cos(this.angle) * this.radius;
    const y = centerY + Math.sin(this.angle) * this.radius;
    const dist = Math.hypot(x - noseX, y - noseY);
    if (dist < interactionDistance) {
      this.isDestroyed = true;
    }
  }
}

export class FrostElementsPool {
  constructor(images) {
    this.frostsQueue = [];
    this.images = images;
    this.spawnTimer = 0;
    this.spawnInterval = CONFIG.FROST_UPDATE_INTERVAL;
    this.canHua = false;
  }

  update(deltaTime, canvas) {
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnFrost(canvas);
    }

    if (this.canHua && this.frostsQueue.length < 100) {
      this.frostsQueue.forEach((f) => (f.isDestroyed = true));
      this.canHua = false;
      // console.log('hua~');
    }

    this.frostsQueue.forEach((f) => f.update(deltaTime));
    this.frostsQueue = this.frostsQueue.filter((f) => f.opacity > 0);

    if (this.frostsQueue.length > 300) {
      this.canHua = true;
      // console.log('can hua~');
    }
  }

  draw(ctx) {
    this.frostsQueue.forEach((f) => f.draw(ctx));
  }

  interact(noseX, noseY, distance) {
    this.frostsQueue.forEach((f) => f.interactWithNose(noseX, noseY, distance));
  }

  spawnFrost(canvas) {
    const angle = Math.random() * Math.PI * 2;

    let radius = Math.min(canvas.width, canvas.height) / 2 + 280;
    const n = this.frostsQueue.length;
    radius = 640 * Math.cos((Math.PI / 1280) * n) + 30;

    const image = this.images[Math.floor(Math.random() * this.images.length)];
    const frost = new Frost(angle, radius, image);
    this.frostsQueue.push(frost);
  }
}
