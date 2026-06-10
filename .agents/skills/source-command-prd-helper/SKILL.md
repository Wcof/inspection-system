---
name: "source-command-prd-helper"
description: "初始化或修复 PRD Helper 项目配置"
---

# source-command-prd-helper

Use this skill when the user asks to run the migrated source command `prd-helper`.

## Command Template

# /prd-helper

请使用用户当前语言响应。中文用户默认中文，英文用户默认英文。

执行以下命令，定位已安装的 PRD Helper，然后初始化或修复当前项目：

```bash
set -euo pipefail

find_prd_helper_root() {
  for dir in ".Codex/skills/prd-helper" ".agents/skills/prd-helper" "."; do
    if [ -f "$dir/scripts/setup-prd-helper.py" ]; then
      printf '%s\n' "$dir"
      return 0
    fi
  done

  candidate=$(find "${CLAUDE_CONFIG_DIR:-$HOME/.Codex}/plugins/cache" -path "*/prd-helper/*/scripts/setup-prd-helper.py" -print -quit 2>/dev/null || true)
  if [ -n "$candidate" ]; then
    dirname "$(dirname "$candidate")"
    return 0
  fi

  return 1
}

skill_root="$(find_prd_helper_root)" || {
  echo "未找到 PRD Helper 安装目录。请先运行：npx skills@latest add Wcof/PRDContextEngine --agent Codex --skill prd-helper -y"
  exit 1
}

python3 "$skill_root/scripts/setup-prd-helper.py" --project . --docs-root docs/prd-helper --agent Codex
```

完成后告诉用户：下一步发送 `/prd-start` 开启采集。
