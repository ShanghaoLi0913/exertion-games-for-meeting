import { FloatImage } from './floatImages.js';
import { CONFIG } from './config.js';
export class Tower {
  constructor(assistantData) {
    this.data = assistantData; // 保存所有服务端数据的引用
    this.id = assistantData.id;

    this.x;
    this.y = CONFIG.VIDEO_HEIGHT - 200; // 塔的 y 坐标

    this.cooldown = false; // 冷却状态（仅用于前端动画效果）

    this.towerImagesRef = this.#createFloatImages();
  }

  // 绘制塔的所有视觉元素
  draw(canvasCtx, length, index) {
    const spacing = CONFIG.VIDEO_WIDTH / (length + 1);
    this.x = spacing * (index + 1);
    // 下方是在 canvas 上绘制的元素
    canvasCtx.font = '64px VT323';
    canvasCtx.fillText(
      'x' + (this.data.curBulletCounts || 0),
      this.x - 60,
      this.y - 30
    );

    // 显示昵称
    canvasCtx.font = '16px VT323';
    canvasCtx.fillStyle = 'white';
    canvasCtx.fillText(
      this.data.nickname || 'Anonymous Player',
      this.x + 25,
      this.y - 22
    );

    canvasCtx.textAlign = 'left'; // 重置对齐方式
    canvasCtx.fillStyle = 'white'; // 重置文字颜色
  }

  #createFloatImages() {
    const flagImage = new FloatImage(
      this.id,
      `././image/${this.data.color}-flag.gif`
    );
    const towerImage = new FloatImage(this.id, '././image/tower.png');
    const bombImage = new FloatImage(this.id, '././image/bomb.png');
    const barImage = new FloatImage(this.id, '././image/bar.png');
    const shoulderLeftImage = new FloatImage(
      this.id,
      '././image/left-shoulder.png'
    );
    const shoulderRightImage = new FloatImage(
      this.id,
      '././image/right-shoulder.png'
    );
    return [
      flagImage,
      towerImage,
      bombImage,
      barImage,
      shoulderLeftImage,
      shoulderRightImage,
    ];
  }

  drawTowerImages() {
    // 肩膀图片
    const shoulderDis = this.data.shoulderDistance || 600;
    const spacing = Math.min(150, (shoulderDis - 200) / 4) / 0.9;

    const circleY = this.y + 185;
    const circleXLeft = this.x - 35 - spacing / 2;
    const circleXRight = this.x - 35 + spacing / 2;

    this.towerImagesRef.forEach((img) => {
      if (img.img.src.includes('flag')) {
        img.drawImg(this.x + 50, this.y - 30, 150, 150);
      } else if (img.img.src.includes('tower')) {
        img.drawImg(this.x - 40, this.y + 90, 200, 200);
      } else if (img.img.src.includes('bomb')) {
        img.drawImg(this.x - 80, this.y - 45, 70, 70);
      } else if (img.img.src.includes('bar')) {
        img.drawImg(this.x - 34, this.y + 180, 200, 36);
      } else if (img.img.src.includes('left')) {
        img.drawImg(circleXLeft, circleY, 115, 115);
      } else if (img.img.src.includes('right')) {
        img.drawImg(circleXRight, circleY, 115, 115);
      }
    });
  }

  updateTowerData(data) {
    this.data = data;
  }

  deleteImages() {
    this.towerImagesRef.forEach((img) => {
      img.deleteImg();
    });
    this.towerImagesRef = []; // 清空数组，避免引用残留
  }
}
