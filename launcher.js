// Memo 后台启动器
// 作用：以「脱离终端、隐藏窗口」的方式启动 server.js，关闭 bat/CMD 窗口后服务照常运行。
// 由 start-hidden.bat / start-detached.bat 调用，也可直接 `node launcher.js`。
//
// 为什么不用 start /b：start /b 仍是当前控制台的子进程，关闭控制台会一并结束服务。
// 这里用 child_process.spawn 的 detached + windowsHide + unref：
//   detached    -> 子进程拥有独立进程组，不随父终端退出
//   windowsHide -> 不弹出黑色控制台窗口
//   unref       -> 父进程（启动器）可立即退出，不等待子进程
const fs = require('fs');
const path = require('path');
const net = require('net');
const { spawn } = require('child_process');

const ROOT = __dirname;
const PID_FILE = path.join(ROOT, '.memo.pid');
const PORT_FILE = path.join(ROOT, '.memo.port');
const LOG_FILE = path.join(ROOT, 'data', 'server.log');

function recordedPort() {
  try {
    const p = parseInt(fs.readFileSync(PORT_FILE, 'utf8').trim(), 10);
    if (p > 0 && p < 65536) return String(p);
  } catch (e) {}
  return '3111';
}

const PORT = process.env.PORT || recordedPort();
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = process.env.MEMO_DATA_DIR || path.join(ROOT, 'data');

// 端口探测：避免重复启动造成 EADDRINUSE
function portInUse(cb) {
  let done = false;
  const sock = net.connect({ host: '127.0.0.1', port: Number(PORT) });
  function finish(used) {
    if (done) return;
    done = true;
    try { sock.destroy(); } catch (e) {}
    cb(used);
  }
  sock.setTimeout(800);
  sock.on('connect', () => finish(true));
  sock.on('error', () => finish(false));
  sock.on('timeout', () => finish(false));
}

portInUse(function (used) {
  if (used) {
    console.log('[Memo] Already running on port ' + PORT + '. No action needed.');
    process.exit(0);
  }

  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
  try { fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true }); } catch (e) {}

  const env = Object.assign({}, process.env, {
    PORT: PORT,
    HOST: HOST,
    MEMO_DATA_DIR: DATA_DIR
  });

  let logFd = 'ignore';
  try { logFd = fs.openSync(LOG_FILE, 'a'); } catch (e) {}

  const child = spawn(process.execPath, [path.join(ROOT, 'server.js')], {
    cwd: ROOT,
    env: env,
    detached: true,
    windowsHide: true,
    stdio: ['ignore', logFd, logFd]
  });

  child.unref();

  try { fs.writeFileSync(PID_FILE, String(child.pid), 'utf8'); } catch (e) {}
  try { fs.writeFileSync(PORT_FILE, PORT, 'utf8'); } catch (e) {}
  if (logFd !== 'ignore') { try { fs.closeSync(logFd); } catch (e) {} }

  console.log('[Memo] Started in background. PID=' + child.pid + ' Port=' + PORT);
  console.log('[Memo] Log: ' + LOG_FILE);
  console.log('[Memo] This window can be closed safely; the server keeps running.');
  process.exit(0);
});
