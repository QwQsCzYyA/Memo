#!/usr/bin/env bash
# ============================================================
#  Memo 环境自检 —— 检查运行环境是否满足要求
#  用法：./check-env.sh
# ============================================================
set -uo pipefail
cd "$(dirname "$0")" || exit 1

OK=0
WARN=0
FAIL=0

ok()   { echo "  ✅ $1"; OK=$((OK+1)); }
warn() { echo "  ⚠️  $1"; WARN=$((WARN+1)); }
bad()  { echo "  ❌ $1"; FAIL=$((FAIL+1)); }

echo "========================================"
echo "  Memo 环境自检"
echo "========================================"

# ---- Node.js ----
# 注意：不能只看 [ -x ]。U盘/FAT32/exFAT 不保存执行位、常被挂载为 noexec，
#       此时文件在、也可能显示可执行，但实际执行会 Permission denied。
#       这里改成"实际执行"判断，并识别出 U盘场景交给 start.sh 自动处理。
echo ""
echo "[1] Node.js 运行时"
LOCAL_NODE="$(pwd)/runtime/linux/node"
SYS_NODE="$(command -v node 2>/dev/null || true)"
check_ver() {
  local v="$1" where="$2"
  local major
  major="$(echo "$v" | sed 's/^v\([0-9]*\).*/\1/')"
  if [ "$major" -ge 18 ] 2>/dev/null; then
    ok "$where Node.js $v（满足 ≥18 要求）"
  else
    bad "$where Node.js $v 版本过低，需要 18 或更高"
    echo "     升级建议：https://nodejs.org/  或 nvm install 18"
  fi
}

if [ -f "$LOCAL_NODE" ] && "$LOCAL_NODE" -v >/dev/null 2>&1; then
  check_ver "$("$LOCAL_NODE" -v)" "内置"
elif [ -f "$LOCAL_NODE" ]; then
  # 文件在但跑不起来：先尝试补 x 位（普通 Linux 只是权限丢失的情况）
  chmod +x "$LOCAL_NODE" 2>/dev/null || true
  if "$LOCAL_NODE" -v >/dev/null 2>&1; then
    ok "内置 Node.js $("$LOCAL_NODE" -v)（已自动修复执行权限）"
  elif [ -n "$SYS_NODE" ] && "$SYS_NODE" -v >/dev/null 2>&1; then
    check_ver "$("$SYS_NODE" -v)" "系统"
    warn "内置 runtime/linux/node 存在但当前位置不可执行（U盘 / noexec 挂载），启动时会优先用系统 node"
  else
    warn "内置 node 存在但当前分区不可执行（U盘 / FAT / exFAT / noexec）"
    echo "     start.sh 会自动复制到本地缓存目录后执行，无需手动处理。"
    echo "     若自动处理失败，可设置 MEMO_NODE_CACHE_DIR 指向允许 exec 的目录。"
  fi
elif [ -n "$SYS_NODE" ] && "$SYS_NODE" -v >/dev/null 2>&1; then
  check_ver "$("$SYS_NODE" -v)" "系统"
  warn "未找到内置 runtime/linux/node，当前仅依赖系统 node"
else
  bad "未找到任何 Node.js 运行时：系统无 node，且项目内 runtime/linux/node 不存在"
  echo "     请确认 runtime/linux/node 已包含（可重新解压 memo-linux.tar.gz），或安装系统 Node.js"
  echo "     Debian/Ubuntu: sudo apt install -y nodejs"
fi

# ---- 依赖 ----
echo ""
echo "[2] 依赖"
if [ -d node_modules ] && [ -n "$(ls -A node_modules 2>/dev/null)" ]; then
  warn "存在 node_modules，但本项目零依赖，可忽略"
else
  ok "零依赖，无需 npm install ✓"
fi

# ---- 端口 ----
echo ""
echo "[3] 端口"
PORT="${PORT:-3111}"
if command -v lsof >/dev/null 2>&1; then
  if lsof -iTCP:"$PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
    warn "端口 $PORT 已被占用（可能服务已在运行）"
  else
    ok "端口 $PORT 可用"
  fi
elif command -v ss >/dev/null 2>&1; then
  if ss -ltn 2>/dev/null | grep -q ":$PORT "; then
    warn "端口 $PORT 已被占用（可能服务已在运行）"
  else
    ok "端口 $PORT 可用"
  fi
else
  ok "无法检测端口占用（缺少 lsof/ss），跳过"
fi

# ---- 数据目录 ----
echo ""
echo "[4] 数据目录"
DATA_DIR="${MEMO_DATA_DIR:-$(pwd)/data}"
if [ -d "$DATA_DIR" ]; then
  if [ -w "$DATA_DIR" ]; then
    ok "数据目录可写：$DATA_DIR"
  else
    bad "数据目录不可写：$DATA_DIR"
    echo "     修复：sudo chown -R \$USER:$USER '$DATA_DIR'"
  fi
  FILES="$(ls -1 "$DATA_DIR" 2>/dev/null | wc -l)"
  ok "目录内已有 $FILES 个文件"
else
  warn "数据目录不存在，启动时会自动创建：$DATA_DIR"
fi

# ---- 上传目录 ----
echo ""
echo "[5] 上传目录"
UP="$DATA_DIR/uploads"
if [ -d "$UP" ]; then
  if [ -w "$UP" ]; then
    ok "上传目录可写：$UP"
  else
    bad "上传目录不可写：$UP"
    echo "     修复：sudo chown -R \$USER:$USER '$UP'"
  fi
else
  warn "上传目录不存在，启动时会自动创建"
fi

# ---- 关键文件 ----
echo ""
echo "[6] 项目文件"
for f in server.js package.json public/index.html public/app.js start.sh stop.sh; do
  if [ -f "$f" ]; then
    ok "$f 存在"
  else
    bad "$f 缺失"
  fi
done

# ---- 换行符（Linux 下 CRLF 会导致脚本报错）----
echo ""
echo "[7] 脚本换行符"
for f in start.sh stop.sh; do
  if [ -f "$f" ]; then
    if head -c 2000 "$f" | grep -q $'\r'; then
      bad "$f 含 CRLF 换行，Linux 下会报错"
      echo "     修复：sed -i 's/\r$//' $f"
    else
      ok "$f 换行符为 LF ✓"
    fi
  fi
done

# ---- 总结 ----
echo ""
echo "========================================"
echo "  通过 $OK · 警告 $WARN · 失败 $FAIL"
echo "========================================"
if [ "$FAIL" -gt 0 ]; then
  echo "有必需项未通过，请先修复上面的 ❌ 项。"
  exit 1
fi
echo "环境就绪，可以启动：bash start.sh"
