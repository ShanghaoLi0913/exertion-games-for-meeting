import {
  PoseLandmarker,
  FilesetResolver,
} from 'https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0';

import { CONFIG } from './src/config.js';
import { PoseData } from './src/poseData.js';
import { PlayerFactory } from './src/player.js';
import { SocketManager } from './src/socketManager.js';
import {
  drawHUD,
  updateAndDrawBullets,
  drawGameEndScreen,
} from './src/utils.js';

// ========== 全局变量 ==========
let poseLandmarker = undefined;
let runningMode = 'VIDEO';
let webcamRunning = false;

const videoWidth = CONFIG.VIDEO_WIDTH;
const videoHeight = CONFIG.VIDEO_HEIGHT;

const video = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

let socketManager;
let me = null; // 当前玩家
let assistantData = []; // 所有助手的数据
let virusHP = 100;
const target = {
  x: CONFIG.VIDEO_HEIGHT / 2 + 220,
  y: 90,
};

let isGameEnded = false; // 添加游戏结束状态标志
let gameEndData = null; // 存储游戏结束数据

// ========== 获取用户昵称 ==========
function getUserNickname() {
  let nickname = localStorage.getItem('userNickname');

  if (!nickname) {
    nickname = prompt(
      '请输入您的昵称:',
      'Player' + Math.floor(Math.random() * 1000)
    );

    // 如果用户取消了输入，使用默认昵称
    nickname = nickname || 'Anonymous Player';

    // 保存到localStorage，下次可以复用
    localStorage.setItem('userNickname', nickname);
  }

  return nickname;
}

// 加载资源
// main.js 顶部
const newFont = new FontFace('VT323', 'url(./fonts/vt323.ttf)');

newFont.load().then((loadedFont) => {
  document.fonts.add(loadedFont);
  console.log('✅ Custom font loaded');
});

// ========== 设置 video + canvas 尺寸 ==========
function setCanvasAndVideoSize() {
  video.width = videoWidth;
  video.height = videoHeight;
  video.style.width = `${videoWidth}px`;
  video.style.height = `${videoHeight}px`;

  canvasElement.width = videoWidth;
  canvasElement.height = videoHeight;
  canvasElement.style.width = `${videoWidth}px`;
  canvasElement.style.height = `${videoHeight}px`;
}

// ========== 初始化 Pose 模型 ==========
const createPoseLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
  );
  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
      delegate: 'GPU',
    },
    runningMode: runningMode,
    numPoses: 1,
  });

  // 模型加载完成后直接启动摄像头
  enableCam();
};
createPoseLandmarker();

// ========== 检查浏览器支持 webcam ==========
const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

if (!hasGetUserMedia()) {
  console.warn('getUserMedia() is not supported by your browser');
}

// ========== 开启摄像头 ==========
function enableCam() {
  if (!poseLandmarker) {
    console.warn('模型正在加载中，请稍后再试...');
    return;
  }

  webcamRunning = true;

  const constraints = {
    video: { width: videoWidth, height: videoHeight },
  };

  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    video.srcObject = stream;
    video.addEventListener('loadeddata', () => {
      setCanvasAndVideoSize();
      predictWebcam();
    });
  });
}

// ========== 初始化 ==========
const nickname = getUserNickname();
socketManager = new SocketManager('http://127.0.0.1:3002', { nickname });

// ========== 每帧识别逻辑 ==========
let lastVideoTime = -1;

// 函数里面的内容一直在循环
async function predictWebcam() {
  if (runningMode === 'IMAGE') {
    runningMode = 'VIDEO';
    await poseLandmarker.setOptions({ runningMode: 'VIDEO' });
  }

  const now = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    poseLandmarker.detectForVideo(video, now, (result) => {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      // 如果游戏结束，显示结束界面
      if (isGameEnded && gameEndData) {
        drawGameEndScreen(canvasCtx, gameEndData);
        canvasCtx.restore();
        me;
        return;
      }

      if (result.landmarks && result.landmarks.length > 0) {
        const poseData = new PoseData(
          result.landmarks[0],
          canvasElement.width,
          canvasElement.height
        );
        // ================ 主逻辑 ==============
        if (me) {
          if (me.role === 'assistant') {
            me.updatePose(poseData, socketManager);
            // 增加弹药
            if (me.produceBullet(poseData) && me.canProduceNow()) {
              socketManager.produceBullet();
            }
          }

          if (me.role === 'hitter') {
            me.updatePose(poseData, canvasCtx);
            const assisId = me.whichFireBullet();

            // 发射炸弹
            if (assisId && me.canFireNow()) {
              socketManager.fireBullet({ clientId: assisId });

              const bullet = me.towers.find((tower) => tower.id === assisId);
              console.log('fire bullet', bullet);
              const bulletPos = {
                x: bullet.x,
                y: bullet.y,
              };
              if (bullet.data.curBulletCounts !== 0) {
                updateAndDrawBullets(bulletPos, target);
              }
            }

            drawHUD(me, canvasCtx, virusHP);
          }
        }
        // ============== 主逻辑结束 ===============
      }

      canvasCtx.restore();
    });
  }

  if (webcamRunning) {
    requestAnimationFrame(predictWebcam);
  }
}

// ========== 事件监听 ==========
function onRoleAssigned(data) {
  me = PlayerFactory.createPlayer(data);
  // console.log(me);
}

function onSnycWithServer(data) {
  // console.log(data);
  // 更新 me 的属性
  data.forEach((e) => {
    if (e.id === me.id) {
      Object.assign(me, e);
    }
  });
  // console.log(me);
  // 更新 tower
  if (me.role === 'hitter') {
    assistantData = data.filter((player) => player.role !== 'hitter');
    me.createAndUpdateTowers(assistantData);
  }
}
socketManager.on('init', onRoleAssigned);
socketManager.on('clientSummary', (data) => {
  onSnycWithServer(data);
});
socketManager.on('serverState', (data) => {
  // console.log(data);
  virusHP = data.virusHP;
});

// 添加游戏结束事件处理
socketManager.on('gameEnd', (data) => {
  console.log('游戏结束!!!!!!!!!!!!!!!!!!!!!!!');
  isGameEnded = true;
  gameEndData = data.message;
});

// 添加游戏重置事件处理
socketManager.on('gameReset', (data) => {
  console.log('游戏重置!!!!!!!!!!!!!!!!!!!!!!!');
  isGameEnded = false;
  gameEndData = null;
  virusHP = 100; // 重置病毒HP
});
