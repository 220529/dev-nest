function show_alert() {
  local title="$1"
  local content="$2"
  # 获取操作系统名称
OS_NAME=$(sw_vers 2>/dev/null)

# 判断是否为 macOS
if [[ -n "$OS_NAME" && "$OS_NAME" =~ ^"macOS" ]]; then
    echo "当前环境是 macOS。"
   osascript -e "tell application \"Shortcuts\" to run shortcut named \"显示提醒\" with input {title: \"$title\", content: \"$content\"}"
else
    echo "当前环境不是 macOS。"
    C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe -File ./runOnSave/Notify.ps1 -text "$content" -tit "$title"
fi
  
  
}

function show_error() {
  local message="$1"
  echo $message
  show_alert "保存失败" "$message"
}