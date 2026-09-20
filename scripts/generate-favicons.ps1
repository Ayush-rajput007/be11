Add-Type -AssemblyName System.Drawing

$inputPath = Join-Path $PSScriptRoot "..\frontend\public\be11_logo.png"
$publicDir = Join-Path $PSScriptRoot "..\frontend\public"

if (-not (Test-Path $inputPath)) {
    Write-Error "Source logo not found at $inputPath"
    exit 1
}

$srcImg = [System.Drawing.Bitmap]::FromFile($inputPath)

# 1. Find non-transparent bounding box for clean centering
$minX = $srcImg.Width
$minY = $srcImg.Height
$maxX = 0
$maxY = 0

for ($y = 0; $y -lt $srcImg.Height; $y++) {
    for ($x = 0; $x -lt $srcImg.Width; $x++) {
        $pixel = $srcImg.GetPixel($x, $y)
        if ($pixel.A -gt 15) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Source Logo Dimensions: $($srcImg.Width)x$($srcImg.Height)"
Write-Host "Bounding Box: minX=$minX, minY=$minY, maxX=$maxX, maxY=$maxY (Width: $($maxX - $minX + 1), Height: $($maxY - $minY + 1))"

$cropW = $maxX - $minX + 1
$cropH = $maxY - $minY + 1

# Function to render crisp, centered square favicon
function Create-SquareFavicon($targetSize, $outputPath) {
    $bmp = New-Object System.Drawing.Bitmap($targetSize, $targetSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    # Scale to fit inside target size with a small margin for aesthetics
    $padding = [Math]::Max(1, [int]($targetSize * 0.05))
    if ($targetSize -le 32) { $padding = 0 } # Maximize pixel usage for 16 & 32
    $availableSize = $targetSize - ($padding * 2)

    $scale = [Math]::Min($availableSize / $cropW, $availableSize / $cropH)
    $drawW = [int]($cropW * $scale)
    $drawH = [int]($cropH * $scale)
    $destX = [int](($targetSize - $drawW) / 2)
    $destY = [int](($targetSize - $drawH) / 2)

    $destRect = New-Object System.Drawing.Rectangle($destX, $destY, $drawW, $drawH)
    $srcRect = New-Object System.Drawing.Rectangle($minX, $minY, $cropW, $cropH)

    $g.DrawImage($srcImg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created: $outputPath ($targetSize x $targetSize)"
}

# Generate PNG icons
Create-SquareFavicon 16 (Join-Path $publicDir "favicon-16x16.png")
Create-SquareFavicon 32 (Join-Path $publicDir "favicon-32x32.png")
Create-SquareFavicon 48 (Join-Path $publicDir "favicon-48x48.png")
Create-SquareFavicon 180 (Join-Path $publicDir "apple-touch-icon.png")
Create-SquareFavicon 192 (Join-Path $publicDir "icon-192.png")
Create-SquareFavicon 512 (Join-Path $publicDir "icon-512.png")

# Generate standard multi-image or 32x32 favicon.ico
# An ICO file embedding PNG data for 16, 32, 48
function Create-IcoFile($icoPath, $png32Path, $png16Path) {
    $png32Bytes = [System.IO.File]::ReadAllBytes($png32Path)
    $png16Bytes = [System.IO.File]::ReadAllBytes($png16Path)

    $ms = New-Object System.IO.MemoryStream
    $bw = New-Object System.IO.BinaryWriter($ms)

    # ICONDIR header: Reserved (2), Type=1 (2), Count=2 (2)
    $bw.Write([uint16]0)
    $bw.Write([uint16]1)
    $bw.Write([uint16]2)

    $offset = 6 + (16 * 2)

    # Entry 1: 32x32
    $bw.Write([byte]32) # Width
    $bw.Write([byte]32) # Height
    $bw.Write([byte]0)  # Color count
    $bw.Write([byte]0)  # Reserved
    $bw.Write([uint16]1) # Planes
    $bw.Write([uint16]32) # Bit count
    $bw.Write([uint32]$png32Bytes.Length) # Bytes in resource
    $bw.Write([uint32]$offset) # Offset

    $offset += $png32Bytes.Length

    # Entry 2: 16x16
    $bw.Write([byte]16) # Width
    $bw.Write([byte]16) # Height
    $bw.Write([byte]0)  # Color count
    $bw.Write([byte]0)  # Reserved
    $bw.Write([uint16]1) # Planes
    $bw.Write([uint16]32) # Bit count
    $bw.Write([uint32]$png16Bytes.Length) # Bytes in resource
    $bw.Write([uint32]$offset) # Offset

    # Data
    $bw.Write($png32Bytes)
    $bw.Write($png16Bytes)

    [System.IO.File]::WriteAllBytes($icoPath, $ms.ToArray())
    $bw.Dispose()
    $ms.Dispose()
    Write-Host "Created multi-size ICO: $icoPath"
}

Create-IcoFile (Join-Path $publicDir "favicon.ico") (Join-Path $publicDir "favicon-32x32.png") (Join-Path $publicDir "favicon-16x16.png")

$srcImg.Dispose()
Write-Host "All favicon assets successfully generated from official BE11 brand logo!"
