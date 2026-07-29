/**
 * OP TT 生活台 - 云端服务器
 * 支持：静态文件服务 + 数据持久化 API
 * 部署到云端后手机可随时随地访问，数据不丢失
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 8080;
const DATA_FILE = path.join(__dirname, 'data.json');

// ===== Middleware =====
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// ===== API: 获取全部数据 =====
app.get('/api/data', (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      return res.json(data);
    }
    res.json({});
  } catch (e) {
    console.error('读取数据失败:', e.message);
    res.status(500).json({ error: '读取数据失败' });
  }
});

// ===== API: 保存全部数据 =====
app.post('/api/data', (req, res) => {
  try {
    const data = req.body;
    // 写入前做基本校验
    if (typeof data !== 'object' || data === null) {
      return res.status(400).json({ error: '无效的数据格式' });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    res.json({ ok: true, time: new Date().toISOString() });
  } catch (e) {
    console.error('保存数据失败:', e.message);
    res.status(500).json({ error: '保存数据失败' });
  }
});

// ===== API: 健康检查 =====
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage().rss,
    dataFile: fs.existsSync(DATA_FILE) ? fs.statSync(DATA_FILE).size + 'bytes' : '不存在',
    time: new Date().toISOString()
  });
});

// ===== 获取本机IP =====
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({ name, address: iface.address });
      }
    }
  }
  return ips;
}

// ===== 启动 =====
app.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs();
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║     🐰 OP TT 生活台 · 云端服务器      ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  本地:   http://localhost:${PORT}`);
  ips.forEach((ip, i) => {
    const label = i === 0 ? '  局域网:  ' : '           ';
    console.log(`║  ${label}http://${ip.address}:${PORT}`);
  });
  console.log('╠══════════════════════════════════════════╣');
  console.log('║  数据存储: ' + DATA_FILE);
  console.log('║  数据独立于设备，随服务器持久化        ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log('║  📱 部署到云端（如 Render.com）后:      ║');
  console.log('║  1. 手机随时随地访问无需电脑开机        ║');
  console.log('║  2. 数据安全保存在服务器               ║');
  console.log('║  3. 多设备共用同一份数据               ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`  按 Ctrl+C 停止服务器`);
});
