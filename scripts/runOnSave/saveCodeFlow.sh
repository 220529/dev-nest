source E:/dev-nest/scripts/runOnSave/functions.sh
id="fccmyi3m4lmxo4os"
accessKey="k1tV6MMG9Zfp1njF7AvRr1h7KH2UaXRM"
accessSecret=$(cat $2/accessSecretTest)
hostPre="https://erp.tintan.net"
host="erp.tintan.net"
echo $accessSecret

if [[ $3 == "qa" ]]; then
    id="fccmyi3m4lmxo4os"
    # accessKey="26mjC4UyHJW24ZKTfuneQqGUFP6C9uHB"
    accessKey="58a62cdb34e8dfd631c9d0c60eb11591"
    accessSecret=$(cat $2/accessSecretQa)
    # TODO: 如果 qa 环境需要独立域名，请修改以下配置
    hostPre="https://erp-staging.tintan.net"
    host="erp-staging.tintan.net"
fi

if [[ $3 == "prod" ]]; then
   id="fccmyi3m4lmxo4os"
    accessKey="26mjC4UyHJW24ZKTfuneQqGUFP6C9uHB"
    accessSecret=$(cat $2/accessSecretProd)
    hostPre="https://erp.tone.top"
    host="erp.tone.top"
fi

# 检查是否是js文件
if [[ $1 != *.js ]]; then
    show_error "不是js文件，请确认目录与文件格式是否正确"
    exit 1
fi

if command -v jq >/dev/null 2>&1; then
    echo "jq 已安装，继续执行脚本"
else
    show_error "jq 未安装。请先安装 jq"
    echo "jq 未安装。请先安装 jq"
    exit 1
fi

# 获取js文件内容
fileData=$(cat $1)
echo "获取到的js文件路径：$1"
dataPath=$(cygpath -w "$(readlink -f $1)") 
echo "获取到的js文件绝对路径：$dataPath"
# 检测是否包含头部注释，如果不包含则添加 /**
#  * @flowId
#  * @flowName
#  * @flowNodeName
#  * @flowNodeType
#  * @flowNodeId
#  * @updateTime
#  */
if perl -0777 -ne 'if (m|^/\*\*.*?\*/|s) { exit 0 } else { exit 1 }' "$1" > /dev/null; then
    echo "文件包含完整的多行注释"
else
    echo "文件不包含完整的多行注释"
    { echo "/**"
      echo " * @flowId"
      echo " * @flowKey"
      echo " * @flowName"
      echo " * @flowNodeName"
      echo " * @flowNodeType"
      echo " * @flowNodeId"
      echo " * @updateTime"
      echo " */"
      echo  # 空行
      cat "$1"
    } > "$1.temp" && mv "$1.temp" "$1"
    exit 1
fi

# 提取 @flowNodeName 后的字段
flow_id=$(awk '/@flowId/{gsub(/\/\*\*|\*\*\//, ""); sub(/@flowId[[:space:]]*/, ""); gsub(/[[:space:]]*\*/, ""); gsub(/[[:space:]]/, ""); print $0}' <<< "$fileData")
flow_key=$(awk '/@flowKey/{gsub(/\/\*\*|\*\*\//, ""); sub(/@flowKey[[:space:]]*/, ""); gsub(/[[:space:]]*\*/, ""); gsub(/[[:space:]]/, ""); print $0}' <<< "$fileData") 
flow_name=$(awk '/@flowName/{gsub(/\/\*\*|\*\*\//, ""); sub(/@flowName[[:space:]]*/, ""); gsub(/[[:space:]]*\*/, ""); gsub(/[[:space:]]/, ""); print $0}' <<< "$fileData")
flow_node_name=$(awk '/@flowNodeName/{gsub(/\/\*\*|\*\*\//, ""); sub(/@flowNodeName[[:space:]]*/, ""); gsub(/[[:space:]]*\*/, ""); gsub(/[[:space:]]/, ""); print $0}' <<< "$fileData")
flow_node_type=$(awk '/@flowNodeType/{gsub(/\/\*\*|\*\*\//, ""); sub(/@flowNodeType[[:space:]]*/, ""); gsub(/[[:space:]]*\*/, ""); gsub(/[[:space:]]/, ""); print $0}' <<< "$fileData")
flow_node_id=$(awk '/@flowNodeId/{gsub(/\/\*\*|\*\*\//, ""); sub(/@flowNodeId[[:space:]]*/, ""); gsub(/[[:space:]]*\*/, ""); gsub(/[[:space:]]/, ""); print $0}' <<< "$fileData")
update_time=$(awk '/@updateTime/{gsub(/\/\*\*|\*\*\//, ""); sub(/@updateTime[[:space:]]*/, ""); gsub(/[[:space:]]*\*/, ""); gsub(/[[:space:]]/, ""); print $0}' <<< "$fileData")

echo "Flow Id: $flow_id"
echo "Flow Key: $flow_key"
echo "Flow Name: $flow_name"
echo "Flow Node Name: $flow_node_name"
echo "Flow Node Type: $flow_node_type"
echo "Flow Node Id: $flow_node_id"
echo "Update Time: $update_time"

# 如果flow_id为空，提示错误
if [[ $flow_id == "" ]]; then
    show_error "flow_id 为空。请先设置 flow_id"
    exit 1
fi

# 如果flow_name为空，提示错误
if [[ $flow_name == "" ]]; then
    show_error "flow_name 为空。请先设置 flow_name"
    exit 1
fi

# 如果flow_node_name为空，提示错误
if [[ $flow_node_name == "" ]]; then
    show_error "flow_node_name 为空。请先设置 flow_node_name"
    exit 1
fi

# 如果flow_node_type为空，提示错误
if [[ $flow_node_type == "" ]]; then
    show_error "flow_node_type 为空。请先设置 flow_node_type"
    exit 1
fi

# 如果flow_node_id为空，提示错误
if [[ $flow_node_id == "" ]]; then
    show_error "flow_node_id 为空。请先设置 flow_node_id"
    exit 1
fi

# 如果update_time为空，提示错误
if [[ $update_time == "" ]]; then
    show_error "update_time 为空。请先设置 update_time"
    exit 1
fi

# $update_time日期和时间中间加一个空格
update_time=$(echo $update_time | sed 's/\(.*\)\(..:..:..\)/\1 \2/g')

saveType="codeFlow"
# 使用jq生成一个新的JSON对象，包含flowId、flowName、flowNodeName、flowNodeType、flowNodeId字段
flowInfo=$(jq -n --arg flowId "$flow_id" --arg flowKey "$flow_key" --arg flowName "$flow_name" --arg flowNodeName "$flow_node_name" --arg flowNodeType "$flow_node_type" --arg flowNodeId "$flow_node_id" --arg updateTime "$update_time" '{flowId: $flowId, flowKey: $flowKey, flowName: $flowName, flowNodeName: $flowNodeName, flowNodeType: $flowNodeType, flowNodeId: $flowNodeId, updateTime: $updateTime}')

# 使用jq生成一个新的JSON对象，包含flowId、accessKey和data字段
json=$(jq -n --arg runFlowId "$id" --arg saveType "$saveType" --arg accessKey "$accessKey" --arg accessSecret "$accessSecret" --arg flowInfo "$flowInfo" --arg hostPre "$hostPre" --arg host "$host" --arg dataPath "$dataPath" '{flowId: $runFlowId, saveType: $saveType, accessKey: $accessKey,accessSecret: $accessSecret, flowInfo: $flowInfo ,hostPre: $hostPre ,host:$host,dataPath:$dataPath}')

# 使用curl发送POST请求
result=$(curl --location --request POST "http://127.0.0.1:9009/api/runFlow" \
--header 'Content-Type: application/json; charset=utf-8' \
--header 'Accept: */*' \
--header "Host: $host" \
--header 'Connection: keep-alive' \
--data-raw "$json")

echo $result
# 判断请求结果是否成功，判断结果中的code是否为1
if [[ $result == *"\"code\":1"* ]]; then
    # 获取返回的data字段里的updateTime字段，更新到json文件中
    updateTime=$(echo $result | jq -r .data.updateTime)
    # 更新js文件中的updateTime字段
    sed -i "s/@updateTime.*/@updateTime $updateTime/g" "$1"
    echo "更新时间：$updateTime写入文件成功"
    
    # 显示详细的成功弹框
    show_alert "代码流保存成功" "流程名称: $flow_name\n更新时间: $updateTime\n\n代码流已成功同步到服务器！"
else
    # 提取错误信息并显示弹框
    error_message=$(echo $result | jq -r '.message // "未知错误"')
    show_error "代码流保存失败！\n\n流程名称: $flow_name\n失败原因: $error_message"
fi
