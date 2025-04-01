import { CONFIG } from './config.js';
import { FloatImage } from './floatImages.js';
import { Tower } from './tower.js';
class Player {
  static color = ['red', 'green', 'blue', 'yellow'];
  constructor(id, role = 'assistant') {
    this.id = id;
    this.role = role;

    this.color = Player.color[Math.floor(Math.random() * Player.color.length)];
    this.poseData = null;
  }

  updatePose(poseData) {
    this.poseData = poseData;
  }
}

class Assistant extends Player {
  constructor(id) {
    super(id, 'assistant');
    this.shoulderDistance = 600;
    this.canProduceBullet = false;
    this.prevCanProduceBullet = false;
    this.curBulletCounts = 0;
    this.bulletCounts = 0; // 添加分数属性
    this.lastScoreTime = 0; // 上次加分时间，用于控制加分频率
    this.color;
    this.nickname = null; // 添加昵称属性
    this.leftShoulder = new FloatImage(this.id, '././image/left-shoulder.png');
    this.rightShoulder = new FloatImage(
      this.id,
      '././image/right-shoulder.png'
    );

    // 添加防抖相关属性
    this.lastProduceTime = 0;
    this.produceDebounceTime = 600; // 1000毫秒的防抖时间
  }

  updatePose(poseData, socket) {
    super.updatePose(poseData);

    this.shoulderDistance = poseData.getDistance(
      'leftShoulder',
      'rightShoulder'
    );
    this.prevCanProduceBullet = this.canProduceBullet;
    this.canProduceBullet = this.shoulderDistance < 400;

    socket.syncShoulderDis(this.shoulderDistance);

    this.#drawShoulders();
    this.#drawUI();
  }

  // 新增方法：绘制玩家信息UI
  #drawUI() {
    // 获取canvas上下文
    const canvas = document.getElementById('output_canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // 在左上角绘制玩家编号和分数
    ctx.save();

    // 设置文本样式
    ctx.font = '36px VT323';
    ctx.fillStyle = this.color || 'white';

    // 绘制半透明背景
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(10, 10, 200, 80);

    // 绘制昵称
    ctx.fillStyle = this.color || 'white';
    ctx.fillText(`${this.nickname || 'Anonymous Player'}`, 20, 45);

    // 绘制分数
    ctx.fillStyle = 'yellow';
    ctx.fillText(`Scores: ${this.bulletCounts}`, 20, 80);

    ctx.restore();
  }

  #drawShoulders() {
    if (!this.poseData) return;

    const left = this.poseData.get('leftShoulder');
    const right = this.poseData.get('rightShoulder');

    if (!left || !right) return;

    const size = 160;
    this.leftShoulder.drawImg(left.x, left.y, size, size);
    this.rightShoulder.drawImg(right.x, right.y, size, size);
  }

  // 更新服务器状态
  updateFromServer(data) {
    this.curBulletCounts = data.curBulletCounts;
    this.shoulderDistance = data.shoulderDistance;
    if (data.bulletCounts !== undefined) {
      this.bulletCounts = data.bulletCounts;
    }
    if (data.nickname) {
      this.nickname = data.nickname;
    }
  }

  // 添加防抖控制方法
  canProduceNow() {
    const now = Date.now();
    if (now - this.lastProduceTime >= this.produceDebounceTime) {
      this.lastProduceTime = now;
      return true;
    }
    return false;
  }

  produceBullet(poseData) {
    if (this.canProduceBullet && !this.prevCanProduceBullet) {
      return true;
    }
    return false;
  }
}

class Hitter extends Player {
  constructor(id) {
    super(id, 'hitter'); // 先调用父类构造函数，再设置其他属性
    this.canFire = true;

    this.noseImage = new FloatImage(crypto.randomUUID(), '././image/nose.gif');
    this.towers = [];
    this.shoulderDistance = 600;

    // 添加防抖相关属性
    this.lastFireTime = 0;
    this.fireDebounceTime = 500; // 500毫秒的防抖时间
  }

  updatePose(poseData, canvasCtx) {
    super.updatePose(poseData);
    this.drawNose();

    this.towers.forEach((tower, index) => {
      tower.draw(canvasCtx, this.towers.length, index);
      tower.drawTowerImages();
    });
  }

  drawNose() {
    if (!this.poseData) return;

    const nose = this.poseData.get('nose');
    if (!nose) return;

    this.noseImage.drawImg(nose.x, nose.y, 160, 160);
  }

  whichFireBullet() {
    let res = null;
    for (const tower of this.towers) {
      const bombPos = { x: tower.x - 65, y: tower.y - 50 };
      if (getDistance(this.poseData.get('nose'), bombPos) < CONFIG.NOSE_DIS) {
        res = tower.id;
        break;
      }
    }
    console.log('fire res' + res);
    return res;
  }

  // 添加防抖控制方法
  canFireNow() {
    const now = Date.now();
    if (now - this.lastFireTime >= this.fireDebounceTime) {
      this.lastFireTime = now;
      return true;
    }
    return false;
  }

  createAndUpdateTowers(assistantData) {
    // 如果服务端assistantData长度大于当前towers长度，说明有新的塔需要创建
    if (assistantData.length > this.towers.length) {
      // 从当前towers长度开始，创建新的塔
      for (let i = this.towers.length; i < assistantData.length; i++) {
        this.towers.push(new Tower(assistantData[i]));
      }
    } else if (assistantData.length < this.towers.length) {
      // 找出需要删除的塔，并调用 deleteImages()
      this.towers.forEach((tower) => {
        if (!assistantData.some((assistant) => assistant.id === tower.id)) {
          tower.deleteImages(); // 先删除图片
        }
      });

      // 过滤掉已删除的塔
      this.towers = this.towers.filter((tower) =>
        assistantData.some((assistant) => assistant.id === tower.id)
      );
    }

    this.towers.forEach((tower) => {
      const assistant = assistantData.find(
        (assistant) => assistant.id === tower.id
      );
      if (assistant) {
        tower.updateTowerData(assistant);
      }
    });
  }
}

function getDistance(o1, o2) {
  const width = Math.abs(o1.x - o2.x);
  const height = Math.abs(o1.y - o2.y);
  return Math.sqrt(width ** 2, height ** 2);
}

export class PlayerFactory {
  static createPlayer({ id, role }) {
    switch (role) {
      case 'assistant':
        return new Assistant(id);
      case 'hitter':
        return new Hitter(id);
      default:
        return new Player(id, role);
    }
  }
}
