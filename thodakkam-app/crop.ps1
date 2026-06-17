Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\SELVA P\.gemini\antigravity-ide\brain\240f1a1b-1526-48c0-b54e-ff61a93a8435\media__1781677124364.jpg"
$destPath = "e:\Thodakkam mobile App\thodakkam-app\assets\images\Thodakkam-circle.png"

$img = [System.Drawing.Image]::FromFile($sourcePath)

$minDim = [Math]::Min($img.Width, $img.Height)
$bmp = New-Object System.Drawing.Bitmap($minDim, $minDim)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)

$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse(0, 0, $minDim, $minDim)

$g.SetClip($path)

$srcRect = New-Object System.Drawing.Rectangle((($img.Width - $minDim) / 2), (($img.Height - $minDim) / 2), $minDim, $minDim)
$destRect = New-Object System.Drawing.Rectangle(0, 0, $minDim, $minDim)
$g.DrawImage($img, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

$bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
$img.Dispose()
