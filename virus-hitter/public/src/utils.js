// utils.js
import { FloatImage } from './floatImages.js';
import { CONFIG } from './config.js';
/**
 * 显示分数增加的动画效果
 * @param {number} x - 动画显示的 x 坐标
 * @param {number} y - 动画显示的 y 坐标
 * @param {number} amount - 增加的分数
 */
export function showScoreAnimation(x, y, amount = 10) {
  const scoreText = document.createElement('div');
  scoreText.textContent = `+${amount}`;
  scoreText.style.position = 'absolute';
  scoreText.style.left = `${x}px`;
  scoreText.style.top = `${y}px`;
  scoreText.style.color = 'yellow';
  scoreText.style.fontSize = '32px';
  scoreText.style.fontFamily = 'VT323, monospace';
  scoreText.style.pointerEvents = 'none';
  scoreText.style.zIndex = '1000';
  scoreText.style.textShadow = '0 0 5px #ff0';
  document.body.appendChild(scoreText);

  // 动画效果 - 向上飘动并消失
  let opacity = 1;
  let posY = y;

  const animate = () => {
    opacity -= 0.02;
    posY -= 1;
    scoreText.style.opacity = opacity;
    scoreText.style.top = `${posY}px`;

    if (opacity > 0) {
      requestAnimationFrame(animate);
    } else {
      document.body.removeChild(scoreText);
    }
  };

  requestAnimationFrame(animate);
}

const virusImage = new FloatImage('virus', '././image/walk.gif');

export function drawHUD(me, canvasCtx, virusHP) {
  if (me?.role === 'hitter') {
    // 文字说明
    canvasCtx.fillStyle = 'white';
    canvasCtx.font = '22px VT323';
    canvasCtx.fillText('Bomb Master 💣: Launch bombs with your nose!', 30, 40);
    canvasCtx.fillText('Energy Engineer 💪: Make ammo by squeezing!', 30, 70);
    canvasCtx.fillText('Defeat the virus! 👾💥', 30, 100);

    // HP 文字
    canvasCtx.font = '88px VT323, monospace';
    canvasCtx.fillStyle = 'purple';
    canvasCtx.fillText('HP: ' + virusHP, CONFIG.VIDEO_HEIGHT / 2 + 320, 100);
    virusImage.drawImg(CONFIG.VIDEO_HEIGHT / 2 + 220, 90, 180, 180);
  }
}

const bombImage = new FloatImage('bomb', '././image/bomb.png');

export function updateAndDrawBullets(bullet, target) {
  // 设置动画参数
  const duration = 1000; // 动画持续时间，毫秒
  const startTime = Date.now();
  const size = 80; // 炸弹图像大小

  // 起始位置
  let currentX = bullet.x;
  let currentY = bullet.y;

  // 保存初始位置用于计算
  const startX = bullet.x;
  const startY = bullet.y;

  // 创建动画函数
  function animate() {
    // 计算当前动画进度 (0-1之间)
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // 计算当前位置 - 线性插值
    currentX = startX + (target.x - startX) * progress;
    currentY = startY + (target.y - startY) * progress;

    // 绘制炸弹
    bombImage.drawImg(currentX, currentY, size, size);

    // 如果动画未完成，继续下一帧
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // 动画完成，可以在这里添加爆炸效果
      showExplosion(target.x, target.y);
    }
  }

  // 开始动画
  animate();
}

// 显示爆炸效果
function showExplosion(x, y) {
  // 创建爆炸效果元素
  const explosion = document.createElement('div');
  explosion.textContent = '💥';
  explosion.style.position = 'absolute';
  explosion.style.left = `${x}px`;
  explosion.style.top = `${y}px`;
  explosion.style.fontSize = '100px';
  explosion.style.zIndex = '1000';
  explosion.style.transform = 'translate(-50%, -50%)';
  document.body.appendChild(explosion);

  // 爆炸效果放大消失动画
  let scale = 1;
  function animateExplosion() {
    scale += 0.05;
    explosion.style.transform = `translate(-50%, -50%) scale(${scale})`;
    explosion.style.opacity = (2 - scale) / 1;

    if (scale < 2) {
      requestAnimationFrame(animateExplosion);
    } else {
      document.body.removeChild(explosion);
    }
  }

  requestAnimationFrame(animateExplosion);
}

/**
 * 绘制游戏结束界面
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {Object} data - 游戏结束数据
 */
export function drawGameEndScreen(ctx, data) {
  const canvas = ctx.canvas;
  const width = canvas.width;
  const height = canvas.height;

  // 半透明黑色背景
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, width, height);

  // 胜利标题
  ctx.font = '72px VT323';
  ctx.fillStyle = 'gold';
  ctx.textAlign = 'center';
  ctx.fillText('🎉 Victory! Virus Eliminated! 🎉', width / 2, height / 3);

  // 显示消息
  // ctx.font = '48px VT323';
  // ctx.fillStyle = 'white';
  // ctx.fillText(data.message, width / 2, height / 3 + 80);

  // 显示得分榜
  // if (data.playerScores && data.playerScores.length > 0) {
  //   ctx.font = '40px VT323';
  //   ctx.fillStyle = 'lightgreen';
  //   ctx.fillText('玩家得分排行:', width / 2, height / 3 + 160);

  //   let yPos = height / 3 + 220;
  //   data.playerScores.forEach((player, index) => {
  //     const medal =
  //       index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
  //     ctx.fillStyle =
  //       index === 0
  //         ? 'gold'
  //         : index === 1
  //         ? 'silver'
  //         : index === 2
  //         ? '#cd7f32'
  //         : 'white';
  //     ctx.fillText(
  //       `${medal} ${player.nickname}: ${player.score} 点`,
  //       width / 2,
  //       yPos
  //     );
  //     yPos += 50;
  //   });
  // }

  // 倒计时提示
  ctx.font = '32px VT323';
  ctx.fillStyle = 'lightblue';
  ctx.fillText('Restart in a few seconds...', width / 2, height / 3 + 120);
}
