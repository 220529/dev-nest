source E:/dev-nest/scripts/runOnSave/functions.sh

id="fccmyi3m4lmxo4os"
accessKey="k1tV6MMG9Zfp1njF7AvRr1h7KH2UaXRM"
accessSecret=$(cat $2/accessSecretTest)
hostPre="https://erp.tintan.net"
host="erp.tintan.net"
echo $accessSecret
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
#  * @formatId
#  * @formatName
#  * @updateTime
#  */
if perl -0777 -ne 'if (m|^/\*\*.*?\*/|s) { exit 0 } else { exit 1 }' "$1" > /dev/null; then
    echo "文件包含完整的多行注释"
else
    echo "文件不包含完整的多行注释"
    { echo "/**"
      echo " * @formatId"
      echo " * @formatName"
      echo " * @flowKey"
      echo " * @updateTime"
      echo " */"
      echo  # 空行
      cat "$1"
    } > "$1.temp" && mv "$1.temp" "$1"
    exit 1
fi

format_id=$(awk '/@formatId/{gsub(/\/\*\*|\*\*\//, ""); sub(/@formatId[[:space:]]*/, ""); gsub(/[[:space:]]*\*/, ""); gsub(/[[:space:]]/, ""); print $0}' <<< "$fileData")
format_key=$(awk '/@formatKey/{gsub(/\/\*\*|\*\*\//, ""); sub(/@formatKey[[:space:]]*/, ""); gsub(/[[:space:]]*\*/, ""); gsub(/[[:space:]]/, ""); print $0}' <<< "$fileData")
format_name=$(awk '/@formatName/{gsub(/\/\*\*|\*\*\//, ""); sub(/@formatName[[:space:]]*/, ""); gsub(/[[:space:]]*\*/, ""); gsub(/[[:space:]]/, ""); print $0}' <<< "$fileData")
update_time=$(awk '/@updateTime/{gsub(/\/\*\*|\*\*\//, ""); sub(/@updateTime[[:space:]]*/, ""); gsub(/[[:space:]]*\*/, ""); gsub(/[[:space:]]/, ""); print $0}' <<< "$fileData")

echo "Format Id: $format_id"
echo "Format Name: $format_name"
echo "Update Time: $update_time"

# 如果format_id为空，提示错误
if [[ $format_id == "" ]]; then
    show_error "format_id 为空。请先设置 format_id"
    exit 1
fi

# 如果format_name为空，提示错误
if [[ $format_name == "" ]]; then
    show_error "format_name 为空。请先设置 format_name"
    exit 1
fi

# 如果update_time为空，提示错误
if [[ $update_time == "" ]]; then
    show_error "update_time 为空。请先设置 update_time"
    exit 1
fi

# $update_time日期和时间中间加一个空格
update_time=$(echo $update_time | sed 's/\([0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}\)\([0-9]\{2\}:\)/\1 \2/')

saveType="formatFunction"
# 使用jq生成一个新的JSON对象，包含formatId、formatName字段
formatInfo=$(jq -n \
  --arg formatId "$format_id" \
  --arg formatKey "$format_key" \
  --arg formatName "$format_name" \
  --arg updateTime "$update_time" \
  '{formatId: $formatId, formatKey: $formatKey, formatName: $formatName, updateTime: $updateTime}')

# flowInfo=$(jq -n --arg flowId "$flow_id" --arg flowKey "$flow_key" --arg flowName "$flow_name" --arg flowNodeName "$flow_node_name" --arg flowNodeType "$flow_node_type" --arg flowNodeId "$flow_node_id" --arg updateTime "$update_time" '{flowId: $flowId, flowKey: $flowKey, flowName: $flowName, flowNodeName: $flowNodeName, flowNodeType: $flowNodeType, flowNodeId: $flowNodeId, updateTime: $updateTime}')

# 使用jq生成一个新的JSON对象，包含formatId、accessKey和data字段
json=$(jq -n \
  --arg flowId "$id" \
  --arg saveType "$saveType" \
  --arg accessKey "$accessKey" \
  --arg formatInfo "$formatInfo" \
  --arg accessSecret "$accessSecret" \
  --arg hostPre "$hostPre" \
  --arg host "$host" \
  --arg dataPath "$dataPath" \
  '{flowId: $flowId, saveType: $saveType, accessKey: $accessKey, accessSecret: $accessSecret, formatInfo: $formatInfo, hostPre: $hostPre, host: $host, dataPath: $dataPath}')

# 使用curl发送POST请求
result=$(curl --location --request POST "http://127.0.0.1:9009/api/runFlow" \
--header 'Content-Type: application/json' \
--header 'Accept: */*' \
--header "Host: $host" \
--header 'Connection: keep-alive' \
--data-raw "$json")

echo $result

# 判断请求结果是否成功，判断结果中的code是否为1
if [[ $result == *"\"code\":1"* ]]; then
    show_alert "保存成功" "保存成功"
    # 获取返回的data字段里的updateTime字段，更新到json文件中
    updateTime=$(echo $result | jq -r .data.updateTime)
    # 更新js文件中的updateTime字段
    sed -i "s/@updateTime.*/@updateTime $updateTime/g" "$1"
    echo "更新时间：$updateTime写入文件成功"
else
    show_error $(echo $result | jq -r .message)
fi
