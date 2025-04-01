import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from 'https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0';
import { FrostSystem } from './frostSystem.js';
import { CONFIG } from './consts.js';

let poseLandmarker = undefined;
let runningMode = 'VIDEO';
let enableWebcamButton;
let webcamRunning = false;

const videoWidth = CONFIG.VIDEO_WIDTH;
const videoHeight = CONFIG.VIDEO_HEIGHT;

const video = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const drawingUtils = new DrawingUtils(canvasCtx);
const frostSystem = new FrostSystem(canvasElement);

// 设置 canvas 和 video 的实际像素尺寸 + 显示尺寸
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

const createPoseLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
  );
  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
      delegate: 'GPU',
    },
    runningMode: runningMode,
    numPoses: 2,
  });

  // 模型加载完成后启用按钮
  if (enableWebcamButton) {
    enableWebcamButton.disabled = false;
    enableWebcamButton.innerText = 'ENABLE';
  }
};
createPoseLandmarker();

// 检查浏览器是否支持 webcam
const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById('webcamButton');
  enableWebcamButton.disabled = true;
  enableWebcamButton.innerText = '模型加载中...';
  enableWebcamButton.addEventListener('click', enableCam);
} else {
  console.warn('getUserMedia() is not supported by your browser');
}

function enableCam(event) {
  if (!poseLandmarker) {
    alert('模型正在加载中，请稍后再试...');
    return;
  }

  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = 'ENABLE PREDICTIONS';
  } else {
    webcamRunning = true;
    enableWebcamButton.innerText = 'DIS';
  }

  const constraints = {
    // video: true,
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

let lastVideoTime = -1;

async function predictWebcam() {
  if (runningMode === 'IMAGE') {
    runningMode = 'VIDEO';
    await poseLandmarker.setOptions({ runningMode: 'VIDEO' });
  }

  let startTimeMs = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    poseLandmarker.detectForVideo(video, startTimeMs, (result) => {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      // 更新和绘制霜雪系统
      frostSystem.update(startTimeMs);
      frostSystem.draw(canvasCtx);

      for (const landmark of result.landmarks) {
        const noseLandmark = landmark[0]; // 鼻子通常是第 0 个点
        if (noseLandmark) {
          // 绘制鼻子关键点
          drawingUtils.drawLandmarks([noseLandmark], {
            radius: (data) => DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1),
          });

          // 鼻子坐标转 canvas 实际像素
          const noseX = noseLandmark.x * canvasElement.width;
          const noseY = noseLandmark.y * canvasElement.height;
          const noseZ = noseLandmark.z;

          // 霜雪碰撞检测
          frostSystem.checkCollision(noseX, noseY, noseZ);
        }
      }

      canvasCtx.restore();
    });
  }

  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}
