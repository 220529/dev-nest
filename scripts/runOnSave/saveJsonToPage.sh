source E:/dev-nest/scripts/runOnSave/functions.sh

# 参数
id="fccmyi3m4lmxo4os"
accessKey="k1tV6MMG9Zfp1njF7AvRr1h7KH2UaXRM"
accessSecret=$(cat $2/accessSecretTest)
hostPre="https://erp.tintan.net"
host="erp.tintan.net"
if [[ $3 == "prod" ]]; then
   id="fccmyi3m4lmxo4os"
    accessKey="26mjC4UyHJW24ZKTfuneQqGUFP6C9uHB"
    accessSecret=$(cat $2/accessSecretProd)
    hostPre="https://erp.tone.top"
    host="erp.tone.top"
fi

# 检查是否是json文件
if [[ $1 != *.json ]]; then
    show_error "不是json文件，请确认目录与文件格式是否正确"
    exit 1
fi

if command -v jq >/dev/null 2>&1; then
    echo "jq 已安装，继续执行脚本"
else
    show_error "jq 未安装。请先安装 jq"
    exit 1
fi
# 获取传入的参数路径对应的文件
# 读取文件内容 && 格式化json

data=$(jq . "$1" 2>/dev/null)

if [[ $? -ne 0 ]]; then
    show_error "请确认保存的json格式是否正确"
    exit 1
fi
# 获取json中的runOnSaveId
runOnSaveId=$(echo $data | jq .runOnSaveId)
runOnSaveKey=$(echo $data | jq .runOnSaveKey)

echo "已获取到保存ID：$runOnSaveId"
echo "已获取到保存Key：$runOnSaveKey"

# 如果runOnSaveId为空，提示错误
if [[ $runOnSaveId == "null" ]]; then
    show_error "runOnSaveId 为空。请先设置 runOnSaveId"
    exit 1
fi

saveType="jsonToPage"
# 使用jq的tostring函数将$data变量的值转换为字符串
# data_string=$(echo $data | jq -r 'tostring')
data_string=$(echo $data | jq '.')

# 使用jq生成一个新的JSON对象，包含flowId、accessKey和data字段
json=$(jq -n --arg flowId "$id" --arg runFlowKey "$runOnSaveKey" --arg saveType "$saveType" --arg accessKey "$accessKey" --arg accessSecret "$accessSecret" --arg saveId "$runOnSaveId" --arg data "$data_string" '{flowId: $flowId, runFlowKey: $runFlowKey, saveType: $saveType, accessKey: $accessKey, accessSecret: $accessSecret, saveId: $saveId, data: $data}')

# 使用curl发送POST请求
result=$(curl --location --request POST "$hostPre/api/open/runFlow" \
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
    # 使用jq的--argjson选项更新json文件中的updateTime字段
    jq --arg updateTime "$updateTime" '.updateTime = $updateTime' "$1" > "$1.tmp" && mv "$1.tmp" "$1"
    echo "更新时间：$updateTime写入文件成功"
else
    show_error $(echo $result | jq -r .message)
fi
