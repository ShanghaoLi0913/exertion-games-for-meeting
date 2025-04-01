import { FrostElementsPool } from './frosts.js'; // 就是你之前写的类

export class FrostSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.images = [];
    this.pool = null;
    this.lastTimestamp = performance.now();

    this._loadImages(['img/1.png', 'img/2.png', 'img/3.png']).then((loaded) => {
      this.images = loaded;
      this.pool = new FrostElementsPool(this.images, canvas);
    });
  }

  async _loadImages(srcList) {
    return Promise.all(
      srcList.map(
        (src) =>
          new Promise((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = () => resolve(img);
          })
      )
    );
  }

  update(currentTimestamp) {
    if (!this.pool) return;
    const delta = (currentTimestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = currentTimestamp;
    this.pool.update(delta, this.canvas);
  }

  draw(ctx) {
    if (!this.pool) return;
    this.pool.draw(ctx);
  }

  checkCollision(noseX, noseY, noseZ) {
    if (!this.pool) return;
    const depthFactor = Math.max(0.6 - noseZ, 0.2); // 鼻子越接近相机，擦除半径越大
    const radius = depthFactor * 100;
    this.pool.interact(noseX, noseY, radius);
  }
}
