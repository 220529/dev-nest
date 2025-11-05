source ~/.bashrc

# 统一设置runOnSave脚本目录
SCRIPT_DIR="E:/dev-nest/scripts/runOnSave"

echo "runOnSave.sh"
echo "格式化保存文件"
# npx prettier --write $1
echo "格式化完成"

echo "保存文件所在路径$0 $1 $2"
# 如果路径是src下的jsonToPage
if [[ $1 == *"src/jsonToPage"* ]]; then
  # 保存jsonToPage文件
  sh $SCRIPT_DIR/saveJsonToPage.sh $1 $2
fi
# 如果路径是src下的codeFlow
if [[ $1 == *"src/codeFlow"* ]]; then
  # 保存codeFlow文件
  sh $SCRIPT_DIR/saveCodeFlow.sh $1 $2
fi
# 如果路径是src下的format
if [[ $1 == *"src/format"* ]]; then
  # 保存format文件
  sh $SCRIPT_DIR/saveFormat.sh $1 $2
fi

# 如果路径是qaSrc下的jsonToPage
if [[ $1 == *"qaSrc/jsonToPage"* ]]; then
  # 保存jsonToPage文件
  sh $SCRIPT_DIR/saveJsonToPage.sh $1 $2 "qa"
fi
# 如果路径是qaSrc下的codeFlow
if [[ $1 == *"qaSrc/codeFlow"* ]]; then
  # 保存codeFlow文件
  sh $SCRIPT_DIR/saveCodeFlow.sh $1 $2 "qa"
fi
# 如果路径是qaSrc下的format
if [[ $1 == *"qaSrc/format"* ]]; then
  # 保存format文件
  sh $SCRIPT_DIR/saveFormat.sh $1 $2 "qa"
fi

# 如果路径是prodSrc下的jsonToPage
if [[ $1 == *"prodSrc/jsonToPage"* ]]; then
  # 保存jsonToPage文件
  sh $SCRIPT_DIR/saveJsonToPage.sh $1 $2 "prod"
fi
# 如果路径是prodSrc下的codeFlow
if [[ $1 == *"prodSrc/codeFlow"* ]]; then
  # 保存codeFlow文件
  sh $SCRIPT_DIR/saveCodeFlow.sh $1 $2 "prod"
fi
# 如果路径是prodSrc下的format
if [[ $1 == *"prodSrc/format"* ]]; then
  # 保存format文件
  sh $SCRIPT_DIR/saveFormat.sh $1 $2 "prod"
fi
