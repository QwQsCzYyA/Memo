# Memo · 文本分享站

零依赖的本地文本分享站 —— 纯 Node.js 标准库实现，**不需要 `npm install`**。

支持：笔记 CRUD、分享广场、主题系统、私信、表情包、站内通知（@提及 / 回复提醒）、
文章置顶与评论锁定、管理后台、评论分页、多语言（7 种）。

---

## 一、环境要求

| 项目 | 要求 |
|---|---|
| Node.js | **无需安装**——项目已内置 Windows / Linux 两个平台的 Node.js v22.22.2 运行时，拷贝即可运行 |
| 依赖 | **无**，不需要 npm install |
| 端口 | 默认 `3111`（可用 `PORT` 环境变量改） |

> **自包含运行时**：`runtime/windows/node.exe`（Windows）和 `runtime/linux/node`（Linux x64）随项目一起提供。
> 启动脚本会**优先使用内置运行时**，找不到时才回退到系统 `node`。因此换到任何一台机器（哪怕没装 Node.js）都能直接启动。
> 若需更换版本或架构（如 Linux ARM64），替换 `runtime/linux/node` 即可。
>
> **U盘 / FAT32 / exFAT 也能跑**：这类文件系统不保存 Unix 执行位，项目可能显示"没有 node.js"或"权限不够"。
> 现在已自动处理——脚本会实际尝试执行内置 node，若当前位置不可执行（noexec / 无 x 位），
> 会自动把 node 复制到本地缓存目录（`~/.cache/memo-runtime`，可用 `MEMO_NODE_CACHE_DIR` 指定）再运行，
> 只首次复制、后续走缓存。配合 `bash start.sh` 启动，整个 U盘场景无需任何手动 chmod。

---

## 二、启动方式

Windows 与 Linux **共用同一份代码与数据**，只是启动方式不同。

### Windows

双击 `启动服务.bat`（前台窗口），或双击 `后台启动.bat`（后台运行）。
停止：双击 `停止服务.bat`。

### Linux

> **推荐一律用 `bash 脚本名` 启动**（如 `bash start.sh`），而不是 `./start.sh`。
> 因为 U盘 / FAT32 / exFAT 不保存 Unix 执行位，`./xxx.sh` 会报 "Permission denied"；
> 用 `bash` 显式调用则不需要 x 位，拷贝过来即可运行。内置 Node 运行时同样会自动处理这个问题。

```bash
# 0) 先跑环境自检（可选但推荐）
bash check-env.sh

# 1) 前台运行（Ctrl+C 停止）
bash start.sh

# 2) 后台运行（推荐）
bash start.sh --daemon

# 3) 其它命令
bash start.sh --status     # 查看状态
bash start.sh --stop       # 停止
bash start.sh --restart    # 重启
```

如果项目放在本机磁盘（ext4 等）且想双击/直接执行，也可以先赋权再用 `./`：
```bash
chmod +x start.sh stop.sh check-env.sh
./start.sh --daemon
```

后台模式日志写在项目目录下的 `memo.log`，PID 写在 `.memo.pid`。

### Linux 脚本速查

| 命令 | 作用 |
|---|---|
| `bash start.sh` | 前台运行（Ctrl+C 停止） |
| `bash start.sh --daemon` | 后台运行 |
| `bash start.sh --status` | 查看运行状态 |
| `bash start.sh --stop` | 停止 |
| `bash start.sh --restart` | 重启（自动沿用上次的运行模式） |
| `bash check-env.sh` | 环境自检（Node 版本 / 端口 / 目录权限 / 换行符） |

> 放在普通磁盘且已 `chmod +x` 时，上表命令也可写成 `./start.sh`。
> 想点一下就启动请用下面的 `.desktop`，它内部已用 `bash start.sh`，U盘上同样有效。

### 像 Windows 一样双击启动（Linux 桌面）

项目根目录的 `memo-launch.desktop` 就是 Linux 版的"快捷方式"。把它放到桌面或应用程序菜单：

```bash
chmod +x memo-launch.desktop     # 首次需要（在 Linux 上执行）
```

- GNOME 桌面：右键图标 → **允许启动**（Allow Launching），之后双击即可
- 双击后自动**后台启动**服务，并打开 `http://127.0.0.1:3111/`
- 停止服务仍用 `bash start.sh --stop`

> 注意：Linux 上直接双击 `.sh` 文件通常只会用文本编辑器打开，想"点一下就启动"请用上面的 `.desktop`，或在终端里执行 `bash start.sh --daemon`。
> `.desktop` 内部用的是 `bash start.sh`，不依赖 x 位，U盘里也能双击启动。

### systemd 守护（Linux 推荐，生产环境）

```bash
# 1) 把项目放到固定位置，例如 ~/memo
cd ~/memo

# 2) 修改 memo.service 里的路径（WorkingDirectory / ExecStart）
sudo nano memo.service

# 3) 安装
sudo cp memo.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable memo      # 开机自启
sudo systemctl start memo       # 立即启动

# 4) 常用命令
sudo systemctl status memo
sudo systemctl restart memo
sudo systemctl stop memo
sudo journalctl -u memo -f      # 看实时日志
```

---

## 三、配置（环境变量）

全部可选，不设置就用默认值。

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `3111` | 监听端口 |
| `HOST` | `0.0.0.0` | 监听地址；设 `127.0.0.1` 则只允许本机访问 |
| `MEMO_DATA_DIR` | `<项目目录>/data` | **数据目录**。想换位置就设这个 |
| `MEMO_LOG` | `<项目目录>/memo.log` | 后台模式的日志文件 |

示例：

```bash
PORT=8080 HOST=0.0.0.0 ./start.sh --daemon
```

---

## 四、Windows 与 Linux 共用同一份数据

数据（笔记、用户、消息、主题、上传的图片…）全部存放在 `data/` 目录里的 JSON 文件中。
两台机器指向同一个 `data/` 目录即可数据互通。

### 方式 A：网络共享目录（推荐）

**Windows 端**共享 `data` 目录（例如 `\\192.168.1.10\memo-data`），
**Linux 端**挂载它：

```bash
# 安装 cifs 工具
sudo apt install -y cifs-utils

# 挂载
sudo mkdir -p /mnt/memo-data
sudo mount -t cifs //192.168.1.10/memo-data /mnt/memo-data \
  -o username=你的账号,password=你的密码,vers=3.0,uid=1000,gid=1000

# 启动时指定数据目录
MEMO_DATA_DIR=/mnt/memo-data ./start.sh --daemon
```

写进 systemd 时：

```ini
Environment=MEMO_DATA_DIR=/mnt/memo-data
```

### 方式 B：直接放在 Linux 上，Windows 侧共享同一目录

反过来也可以：数据放在 Linux 的 `/srv/memo-data`，
Windows 用 `\\<linux-ip>\memo-data` 访问。两端都设 `MEMO_DATA_DIR` 指向它。

### ⚠️ 同时运行的注意事项

- **不建议两端同时监听同一端口**：可以错开端口（如 Windows 3111、Linux 8080），
  两端都指向同一份数据，这样任何一端访问都能看到全部内容。
- 数据写入用的是「临时文件 + 原子重命名」，单次写入是安全的；
  但**同一个文件的读-改-写**（例如同时注册两个用户）理论上可能互相覆盖。
  错开端口使用、或只让一端承担写操作，可以规避。

---

## 五、目录结构

```
memo/
├── server.js          # 主服务（零依赖，~2600 行）
├── start.sh           # Linux 启动脚本
├── stop.sh            # Linux 停止脚本
├── check-env.sh       # Linux 环境自检脚本
├── memo.service       # systemd 服务模板
├── package.json       # 仅用于元信息 & npm start，不需要 install
├── README.md
├── public/            # 前端静态资源
│   ├── index.html     # 写作页（支持 /n/RAND 随机申请笔记）
│   ├── plaza.html     # 分享广场
│   ├── note.html      # 笔记详情（评论、表情包回复、@提及、置顶/锁定）
│   ├── messages.html  # 私信（表情包、添加到表情、多选）
│   ├── profile.html   # 个人主页
│   ├── settings.html  # 设置（主题、资料、邮箱）
│   ├── feedback-admin.html  # 管理后台
│   ├── app.js / user-panel.js / notifications.js / i18n.js / ...
│   └── vendor/katex/  # 公式渲染（已内置）
├── runtime/           # ★ 内置 Node.js 运行时（自包含，无需系统安装）
│   ├── windows/node.exe   # Windows x64 版（~84 MB）
│   └── linux/             # Linux x64 版（~119 MB，含 npm/npx/corepack）
└── data/              # ★ 所有数据都在这里（可直接备份/迁移）
    ├── notes.json     # 笔记（含评论、点赞）
    ├── users.json     # 用户账号
    ├── messages.json  # 私信
    ├── notifications.json  # 站内通知
    ├── themes.json    # 主题
    ├── settings.json  # 全局设置
    ├── settings-users.json  # 各用户的主题偏好
    ├── stickers.json  # 表情包库
    ├── invites.json   # 邀请码
    ├── applications.json  # 注册申请
    └── uploads/       # 上传的图片
```

**备份 = 复制 `data/` 目录。** 迁移服务器也是同样的操作。

---

## 六、初始账号与权限

| 角色 | 说明 |
|---|---|
| **所有者**（`admin`） | 内置账号，编号 `#-1`，可授予/收回管理员、封禁用户、置顶与锁定文章、查看反馈管理。初始密码见 `data/settings.json` 的 `adminPass` |
| **管理员** | 由所有者授予，可进入反馈管理页 |
| 普通用户 | 通过**邀请码**或**向所有者申请**注册 |

### 给自己发邀请码

```bash
node -e "const fs=require('fs');const p='data/invites.json';const a=JSON.parse(fs.readFileSync(p,'utf8'));a.list=a.list||[];const c=require('crypto').randomBytes(4).toString('hex').toUpperCase().slice(0,8);a.list.push({code:c,used:false,revoked:false,note:'',createdAt:new Date().toISOString()});fs.writeFileSync(p,JSON.stringify(a,null,2));console.log('邀请码:',c);"
```

### 在管理后台创建邀请码 / 审核注册申请

用所有者账号登录 → 顶栏「反馈管理」→ 可生成邀请码、审核注册申请、管理用户权限。

---

## 七、常用地址

| 路径 | 说明 |
|---|---|
| `/` | 写作页 |
| `/plaza` | 分享广场 |
| `/n/RAND` | 随机申请一个新的空记事本 |
| `/n/<自定义ID>` | 打开指定 ID 的记事本（没人用过则归你） |
| `/u/<用户编号>` | 个人主页 |
| `/messages` | 私信 |
| `/settings` | 设置 |
| `/QWQ` | 管理后台（需管理员及以上） |

---

## 八、常见问题

**Q：端口被占用？**
改端口：`PORT=8080 ./start.sh`。

**Q：忘记所有者密码？**
删除 `data/settings.json` 里的 `adminPass` 字段后重启服务会重新生成，
或直接改 `data/users.json` 中 `admin` 账号的密码哈希。

**Q：想清空站点数据重新开始？**
停掉服务，删掉 `data/` 目录（保留 `uploads/`），重启即可。

**Q：公式（LaTeX）不显示？**
KaTeX 已内置在 `public/vendor/katex/`，无需联网。

**Q：Linux 上文件权限报错？**
```bash
chmod -R u+rwX data
```

**Q：Linux 上报"没有 node.js / Permission denied"，尤其是放 U盘里？**
不用装 Node.js，也不用手动 chmod。用 `bash start.sh` 启动即可，脚本会：
1. 先实际尝试执行内置 `runtime/linux/node`；
2. 如果只是缺 x 位，自动补上；
3. 如果是在 U盘 / noexec 挂载上（chmod 也没用），自动把 node 复制到本地缓存目录再执行。

若仍失败，可显式指定缓存位置（需允许 exec）：
```bash
MEMO_NODE_CACHE_DIR=/home/你的用户名/.cache/memo-runtime bash start.sh --daemon
```
也确认内置文件确实存在（`memo-linux.tar.gz` 解压后自带 x 位）：
```bash
bash check-env.sh
```
（Windows 的 `runtime/windows/node.exe` 无需任何权限处理。）
