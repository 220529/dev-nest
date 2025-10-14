param([string]$text,[string]$tit)
Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# 判断是否使用弹框模式（标题包含特定关键词时使用弹框）
$useDialog = $tit -match "(保存成功|保存失败|代码流)"

if ($useDialog) {
    # 使用弹框模式
    if ($tit -eq "保存失败") {
        # 错误弹框
        [System.Windows.MessageBox]::Show($text, $tit, 'OK', 'Error')
    } else {
        # 成功弹框
        [System.Windows.MessageBox]::Show($text, $tit, 'OK', 'Information')
    }
} else {
    # 使用托盘通知模式（保持原有逻辑）
    $notification = New-Object System.Windows.Forms.NotifyIcon

    # 构建"成功"图标（绿色对勾）
    function New-SuccessIcon {
        $size = 32
        $bmp = New-Object System.Drawing.Bitmap $size, $size
        $gfx = [System.Drawing.Graphics]::FromImage($bmp)
        $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $gfx.Clear([System.Drawing.Color]::Transparent)

        $green = [System.Drawing.Color]::FromArgb(0,166,81)
        $brush = New-Object System.Drawing.SolidBrush $green
        $gfx.FillEllipse($brush,1,1,$size-2,$size-2)

        $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), 4
        $points = @(
            (New-Object System.Drawing.Point 8,17),
            (New-Object System.Drawing.Point 14,23),
            (New-Object System.Drawing.Point 25,11)
        )
        $gfx.DrawLines($pen, $points)

        $gfx.Dispose()
        $icon = [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
        return @{ Icon = $icon; Bmp = $bmp }
    }

    # 托盘图标：失败为系统错误图标；成功为自绘绿色对勾
    if ($tit -eq "保存失败") {
        $notification.Icon = [System.Drawing.SystemIcons]::Error
    } else {
        $success = New-SuccessIcon
        if ($success -and $success.Icon) {
            $notification.Icon = $success.Icon
        } else {
            $notification.Icon = [System.Drawing.SystemIcons]::Information
        }
    }

    $notification.Visible = $true

    # 气泡内容与图标
    $notification.BalloonTipTitle = $tit
    $notification.BalloonTipText = $text
    if ($tit -eq "保存失败") {
        $notification.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::Error
    } else {
        $notification.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::Info
    }

    # 使用已设置的 BalloonTip* 属性显示通知
    $notification.ShowBalloonTip(3000)

    # 给气泡展示留出时间，然后释放资源，避免托盘残留
    Start-Sleep -Milliseconds 3500
    $notification.Dispose()

    # 释放自绘图标资源（如已创建）
    if ($success -and $success.Bmp) { $success.Bmp.Dispose() }
}