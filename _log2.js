const fs = require('fs');
const p = 'C:/Users/admin/WorkBuddy/2026-11-19-14-49-20/.workbuddy/memory/2026-11-19.md';
const add = [
'- **敏感文件泄露 + XSS反馈 + 切页闪白修复**（2026-11-19 深夜）：',
'  - **敏感文件泄露根因**：上一轮把 isLocalIp 放宽到整个内网段后，firewall() 首行 `if(isLocalIp(ip)) return false` 直接跳过全部防护（含 SENSITIVE_PATH），导致局域网任何人访问 /data/users.json、/server.js 等拿到 200 明文数据。修复：把 SENSITIVE_PATH 拦截提到 isLocalIp 之前，对所有来源生效（内网只拦不 strike）；并对 pathname 做多次 decodeURIComponent + 反斜杠归一，堵住 %2f/%252f 编码绕过。删除原来靠后的重复拦截块。实测：7 类敏感路径+3 类编码绕过全 404，正常页面 200。',
'  - **反馈处理**：data/feedback.json 有 2 条 XSS 测试 payload（![x" onerror=alert(1)]...），经核查管理页/通知渲染均用 textContent/escapeHtml，未执行，安全。2 条已移到 rubbish bin/feedback-junk-*.json，反馈清空。',
'  - **切页闪白（视频取证）**：用 opencv 抽帧确认 f024/f028/f040 整页纯白（切页瞬间），是深色主题下 css/主题未应用露出默认白底。修复 boot.js：applyVars 里同步给 documentElement.style.background 设主题兜底色（深色=#0b0e14）+ colorScheme，html 根背景在最底层不遮 z-index:-2 的 #bg-layer，故永久保留不清除（delete 原 clearInlineBg）。所有页面 head 已是 boot.js 在 style.css 之前。',
'  - 新增：opencv-python-headless、playwright 已 pip 安装（用于视频取证/视觉验证）。视频帧在 E:/bin/frames2，联系表 E:/bin/contact.jpg。',
''
].join('\n');
fs.appendFileSync(p, add, 'utf8');
console.log('appended', add.length);
