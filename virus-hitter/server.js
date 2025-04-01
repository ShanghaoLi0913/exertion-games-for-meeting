// server.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3002;
const server = app.listen(PORT, () => {
  console.log(`🚀 Socket server running on port ${PORT}`);
});

const CONFIG = {
  // 参数

  VIRUS_HP: 100,
  RESTART_TIME: 5000,
};

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// 静态资源
app.use(express.static('public'));

// 所有连接的客户端状态
let clients = {}; // { socketId_1: { id, role, bulletCounts, curBulletCounts, name, color, nickname },  socketId_1: {}}

// 服务端统一状态
let serverState = {
  virusHP: CONFIG.VIRUS_HP, // 病毒血量
  gameActive: true, // 添加游戏活动状态
};

// 判断是否已存在hitter角色
function hasHitter() {
  return Object.values(clients).some((client) => client.role === 'hitter');
}

// 向所有客户端广播最新状态
function broadcastClientStates() {
  const summary = Object.values(clients).map(
    ({
      id,
      role,
      bulletCounts,
      curBulletCounts,
      color,
      nickname,
      shoulderDistance,
    }) => ({
      id,
      role,
      bulletCounts,
      curBulletCounts,
      color,
      nickname,
      shoulderDistance,
    })
  );
  // 检查游戏是否结束
  checkGameEnd();

  io.emit('clientSummary', summary); // 通知所有客户端，更新客户端状态
  io.emit('serverState', serverState); // 通知所有客户端，更新服务器状态
}

// 检查游戏是否结束
function checkGameEnd() {
  if (serverState.virusHP <= 0 && serverState.gameActive) {
    serverState.gameActive = false;

    // 计算所有玩家的分数
    // const playerScores = Object.values(clients)
    //   .filter((client) => client.role === 'assistant')
    //   .map((client) => ({
    //     id: client.id,
    //     nickname: client.name || '匿名玩家',
    //     score: client.bulletCounts || 0,
    //   }))
    //   .sort((a, b) => b.score - a.score);

    // 发送游戏结束事件
    io.emit('gameEnd', {
      message: '🎉Condualations! You have defeated the virus!',
    });

    console.log('🎮 游戏结束，病毒已被消灭！');

    // 5秒后重置游戏
    setTimeout(resetGame, CONFIG.RESTART_TIME);
  }
}

// 重置游戏状态
function resetGame() {
  serverState.virusHP = 5;
  serverState.gameActive = true;

  // 重置所有玩家的子弹数
  for (const id in clients) {
    if (clients[id].role === 'assistant') {
      clients[id].curBulletCounts = 0;
    }
  }

  // 通知所有客户端游戏重置
  io.emit('gameReset', { message: '新游戏开始！' });
  console.log('🔄 游戏已重置，新游戏开始');

  broadcastClientStates();
}

// 新客户端连接
io.on('connection', (socket) => {
  const id = socket.id;
  const role = hasHitter() ? 'assistant' : 'hitter';
  console.log('🟢 Connected with ID:', id);

  // 获取昵称（从连接查询参数中）
  const nickname = socket.handshake.query.nickname || 'Anonymous Player';

  // 设置默认颜色
  const colors = ['red', 'blue', 'green', 'yellow'];
  const color = colors[Object.keys(clients).length % colors.length];

  // 初始化客户端状态
  clients[id] = {
    id,
    role,
    bulletCounts: 0,
    curBulletCounts: 0,
    nickname: nickname,
    color,
    shoulderDistance: 600,
  };
  console.log(`👤 New client: ${clients[id].nickname}`);

  // 返回客户端
  socket.emit('init', {
    id,
    role,
    bulletCounts: 0,
    curBulletCounts: 0,
    nickname: nickname,
    color,
    shoulderDistance: 600,
  });

  broadcastClientStates();

  // === 事件处理函数 ===

  // 客户端请求发射子弹（无需客户端计算子弹数，由服务器处理）
  socket.on('fireBullet', (data) => {
    const clientId = data.clientId;

    if (
      clients[clientId] &&
      clients[clientId].curBulletCounts > 0 &&
      serverState.gameActive
    ) {
      // 减少当前子弹数量
      clients[clientId].curBulletCounts--;

      // 减少病毒血量
      serverState.virusHP = Math.max(0, serverState.virusHP - 1);

      console.log(
        `发射子弹：客户端ID ${clientId} 当前子弹数 ${clients[clientId].curBulletCounts}，病毒HP: ${serverState.virusHP}`
      );

      // 通知所有客户端子弹发射事件，更新显示
      io.emit('bulletFired', {
        clientId: clientId,
        curBulletCounts: clients[clientId].curBulletCounts,
        virusHP: serverState.virusHP,
      });
    }
    broadcastClientStates();
  });

  // 处理生产子弹事件
  socket.on('produceBullet', (data) => {
    const id = socket.id;

    // 只有游戏活动时才能生产子弹
    if (!serverState.gameActive) return;

    // 只验证是否为 Assistant 角色，其他判断由客户端完成
    if (!clients[id] || clients[id].role !== 'assistant') {
      console.log(`非 Assistant 角色无法生产子弹: ${id}`);
      return;
    }

    // 直接增加子弹数量
    clients[id].bulletCounts = (clients[id].bulletCounts || 0) + 1;

    // 增加当前子弹数量
    clients[id].curBulletCounts = (clients[id].curBulletCounts || 0) + 1;

    console.log(
      `玩家 ${id} 成功生产子弹，当前数量: ${clients[id].curBulletCounts}`
    );

    // 广播子弹生产成功
    io.emit('bulletProduced', {
      id: id,
      curBulletCounts: clients[id].curBulletCounts,
    });

    // 更新客户端状态
    broadcastClientStates();
  });

  socket.on('syncShoulderDis', (dis) => {
    const id = socket.id;
    clients[id].shoulderDistance = dis;
    broadcastClientStates();
  });

  // 客户端断开
  socket.on('disconnect', () => {
    delete clients[id];
    console.log(`🔴 Client disconnected: ${id}`);

    broadcastClientStates();
  });
});
