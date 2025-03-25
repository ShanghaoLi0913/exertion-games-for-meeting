let textures = [];
let grasTextures = []
let grasRandomPos = []
let snow = [];
let w;
let h;

// ml5 Face Detection Model
let faceapi;
let detections = [];
// Video
let video;
const faceOptions = { 
  withLandmarks: true, 
  withExpressions: false, 
  withDescriptors: false
};

function preload() { //加载鲜花图片
  gras = loadImage('grass.png'); 
  grasTop = loadImage('grassTop.png'); 
  grasBottom = loadImage('grassBottom.png'); 
  grasLeft = loadImage('grassLeft.png'); 
  grasRight = loadImage('grassRight.png'); 
  grasRandom = loadImage('grassRandom.png'); 
  flowers = loadImage('staticimg.png'); 

  minX = 0 
  maxX = min(windowWidth,windowHeight*1.78)
  minY = 0
  maxY = windowHeight;
  //Math.random() * (max - min) + min;
  for (let i = 0; i < 30; i += 1){
    //left
    grasRandomPos.push([
      Math.random() * (48 - minX) + minX, //x
      Math.random() * (maxY - minY) + minY, //y
    ])
    //right
    grasRandomPos.push([
      Math.random() * (maxX- maxX-32) + maxX-32,
      Math.random() * (maxY - minY) + minY,
    ])
    //top
    grasRandomPos.push([
      Math.random() * (maxX- minX) + minX,
      Math.random() * (48 - minY) + minY,
    ])
    //bottom
    grasRandomPos.push([
      Math.random() * (maxX- minX) + minX,
      Math.random() * (maxY - maxY-32) + maxY-32,
    ])
  }
  console.log(grasRandomPos)
}

function setup() {
  createCanvas(windowHeight*1.78, windowHeight); //画布大小跟随窗口
  gravity = createVector(0, 0.5); //设定重力

  //裁剪鲜花素材
  w = flowers.width / 6;
  h = flowers.height / 7;
  for (let x = 0; x < flowers.width; x += w) { 
    for (let y = 0; y < flowers.height; y += h) { 
      let img = flowers.get(x, y, w, h); //获取单个鲜花图片
      textures.push(img); //放在textures里
    }
  }

  //裁剪特殊草坪素材
  w = grasRandom.width / 4;
  h = grasRandom.height / 8;
  for (let x = 0; x < grasRandom.width; x += w) { 
    for (let y = 0; y < grasRandom.height; y += h) { 
      let img = grasRandom.get(x, y, w, h); 
      grasTextures.push(img); 
    }
  }
  //console.log('grasTextures:',grasTextures.length)

  //准备camera
  video = createCapture(VIDEO);
  video.size(windowHeight*1.78, windowHeight);
  video.hide(); //让video显示在canvas上而不是堆叠元素
  faceapi = ml5.faceApi(video, faceOptions, faceReady); //调用api
}

function modelReady() {
  select("#status").html("Model Loaded");
}

let standup;
let sitdown;
function draw() {
  background(0, 255, 0);
  image(video, 0, 0, width, width * video.height / video.width);

  image
 
  ////围绕window四边画相框
    N =  windowWidth/16;
    M = windowHeight/16;

  ////画出相框内边缘
  for (let x = 1; x < N; x += 1){ //横
    //top
    image(grasTop, x*16, 60, 16, 16);
    //bottom
    image(grasBottom, x*16, windowHeight-72, 16, 16);
  } 
  for (let y = 3; y < N-10; y += 1){
    //left
    image(grasLeft, 60, y*16, 16, 16);
    //right
    image(grasRight, min(windowWidth,windowHeight*1.78)-72, y*16, 16, 16);
  }

  ////填充相框内侧
  for (let x = 0; x < N; x += 1){ //横
    //top
    image(gras, x*16, 0, 16, 16);
    image(gras, x*16, 16, 16, 16);
    image(gras, x*16, 32, 16, 16);
    image(gras, x*16, 48, 16, 16);
    //bottom
    image(gras, x*16, windowHeight-16, 16, 16);
    image(gras, x*16, windowHeight-32, 16, 16);
    image(gras, x*16, windowHeight-48, 16, 16);
    image(gras, x*16, windowHeight-60, 16, 16);
  } 
  for (let y = 0; y < N; y += 1){ //竖
    ////left
    image(gras, 0, y*16, 16, 16);
    image(gras, 16, y*16, 16, 16);
    image(gras, 32, y*16, 16, 16);
    image(gras, 48, y*16, 16, 16);
    ////right
    image(gras, min(windowWidth,windowHeight*1.78)-16, y*16, 16, 16);
    image(gras, min(windowWidth,windowHeight*1.78)-32, y*16, 16, 16);
    image(gras, min(windowWidth,windowHeight*1.78)-48, y*16, 16, 16);
    image(gras, min(windowWidth,windowHeight*1.78)-60, y*16, 16, 16);
  } 
  //填充四个重合角
  image(gras, 60, 60, 16, 16); //top-left
  image(gras, 60, windowHeight-72, 16, 16); //bottom-left
  image(gras, min(windowWidth,windowHeight*1.78)-72, 60, 16, 16); //top-right
  image(gras, min(windowWidth,windowHeight*1.78)-72, windowHeight-72, 16, 16); //bottom-right

  //添加一些特殊草坪效果
  j = 0;
  for(i = 0; i < 120; i += 1) {
    if(j < 32){ //32个特殊草坪效果
      image(grasTextures[j], grasRandomPos[i][0], grasRandomPos[i][1], 16, 16); //top-left
      j += 1
    }else{
      j = 0
    }
  }


  //面部处理
  if (detections) { 
    //console.log('length:', detections.length);
    if (detections.length > 0) {//采集到面部图像 画出五官
      //drawLandmarks(detections); 
      sitdown = second();
      //console.log('sitdown:', sitdown);
    }
    else{ //面部出框 检测站立时间
      standup = second();
      console.log('sitdown:', sitdown);
      console.log('standup:', standup);
      console.log('standup time:', standup - sitdown);
      if (standup - sitdown > 5){ //每站10s 产生鲜花
        console.log('🌹🌹🌹');
        blossom();
        sitdown = standup;
      }
      if (standup - sitdown < 0){ //异常值修正
        sitdown = second();
        standup = second();
      }
    }
  }

  //画生成的鲜花
  for(let x = 0; x < series.length; x += 1){
    image(textures[series[x]], posXs[x], posYs[x], 32, 32);
  }

}

function faceReady() {
  faceapi.detect(gotFaces);
}

// Got faces
function gotFaces(error, result) {
  if (error) {
    console.log(error);
    return;
  }
  detections = result;
  faceapi.detect(gotFaces);
}

function drawLandmarks(detections) {
  noFill();
  stroke(161, 95, 251);
  strokeWeight(2);
  for (let i = 0; i < detections.length; i += 1) {
    const mouth = detections[i].parts.mouth;
    const nose = detections[i].parts.nose;
    const leftEye = detections[i].parts.leftEye;
    const rightEye = detections[i].parts.rightEye;
    const rightEyeBrow = detections[i].parts.rightEyeBrow;
    const leftEyeBrow = detections[i].parts.leftEyeBrow;
    drawPart(mouth, true);
    drawPart(nose, false);
    drawPart(leftEye, true);
    drawPart(leftEyeBrow, false);
    drawPart(rightEye, true);
    drawPart(rightEyeBrow, false);
    //return mouth
  }
}

function drawPart(feature, closed) {
  beginShape();
  for (let i = 0; i < feature.length; i += 1) {
    const x = feature[i]._x;
    const y = feature[i]._y;
    vertex(x, y);
  }
  if (closed === true) {
    endShape(CLOSE);
  } else {
    endShape();
  }
}

let number;
let posXs = [];
let posYs = [];
let series = [];
function blossom(){
  var number = Math.floor(Math.random() * 19); //随机选择一个鲜花
  series.push(number)
  var posX = Math.random() * windowWidth;
  var posY = Math.random() * windowHeight;
  // if(Math.random()>=0.5){
  //   if(Math.random()>=0.5){ //x变为0或最大值
  //     posX = 0;
  //   }else{
  //     posX = windowWidth-32;
  //   }
  // }else{
  //   if(Math.random()>=0.5){ //y变为0或最大值
  //     posY = 0;
  //   }else{
  //     posY = windowHeight-32; //
  //   }
  // }
  // posXs.push(posX);
  // posYs.push(posY);

    if(Math.random()>0.5){
      if(Math.random()>0.5){ //x定位在left或right
        posX = Math.random() * (48 - minX) + minX
      }else{
        posX = Math.random() * (maxX- maxX-32) + maxX-32
      }
    }else{
      if(Math.random()>=0.5){ //y定位在bottom或top
        posY = Math.random() * (48 - minY) + minY
      }else{
        posY = Math.random() * (maxY - maxY-32) + maxY-32 
      }
    }
    posXs.push(posX);
    posYs.push(posY);
}


// Math.random() => [0, 1) => [0, 0.5), [0.5, 1)
//min ≤ num ≤ max
//Math.round(Math.random() * (max - min)) + min;