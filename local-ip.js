// 启动时探测本机局域网 IPv4，供 bat 回显真实地址（换电脑/换网段不再误导）
// 零依赖，复用项目自带 Node 运行时；优先跳过虚拟网卡，取物理网卡地址
const os = require('os');
const nets = os.networkInterfaces() || {};
const skipNic = /vEthernet|VMware|VirtualBox|WSL|docker|TAP|Hyper-V|Loopback/i;
let first = '';
let best = '';
for (const name of Object.keys(nets)) {
  const list = nets[name] || [];
  for (const a of list) {
    const fam = a.family;
    if ((fam === 'IPv4' || fam === 4) && !a.internal) {
      if (!first) first = a.address;
      if (!skipNic.test(name)) { best = a.address; break; }
    }
  }
  if (best) break;
}
process.stdout.write(best || first || '127.0.0.1');
