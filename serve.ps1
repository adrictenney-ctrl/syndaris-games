# Tiny static web server so phones on your Wi-Fi can open the game from this computer.
# Usage (PowerShell):  .\serve.ps1            then open one of the printed addresses.
# Windows may ask to allow PowerShell through the firewall - allow it on private networks.
param([int]$Port = 8090)

$root = [IO.Path]::GetFullPath($PSScriptRoot)
$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
  '.svg' = 'image/svg+xml'; '.png' = 'image/png'; '.json' = 'application/json'; '.webmanifest' = 'application/manifest+json'
  '.ico' = 'image/x-icon'; '.md' = 'text/plain; charset=utf-8'
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
$listener.Start()
Write-Host "Serving $root"
Write-Host "  This computer:  http://localhost:$Port"
Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
  ForEach-Object { Write-Host "  On your Wi-Fi:  http://$($_.IPAddress):$Port   <- open this on the table device" }

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $stream.ReadTimeout = 3000
    $reader = [IO.StreamReader]::new($stream)
    $requestLine = $reader.ReadLine()
    while ($true) { $line = $reader.ReadLine(); if ([string]::IsNullOrEmpty($line)) { break } }
    if (-not $requestLine) { continue }

    $path = [Uri]::UnescapeDataString((($requestLine -split ' ')[1] -split '\?')[0])
    if ($path -eq '/' -or $path -eq '') { $path = '/index.html' }
    $full = [IO.Path]::GetFullPath((Join-Path $root $path.TrimStart('/')))

    if ($full.StartsWith($root) -and (Test-Path $full -PathType Leaf)) {
      $body = [IO.File]::ReadAllBytes($full)
      $type = $mime[[IO.Path]::GetExtension($full).ToLower()]
      if (-not $type) { $type = 'application/octet-stream' }
      $status = '200 OK'
    } else {
      $body = [Text.Encoding]::UTF8.GetBytes('Not found')
      $type = 'text/plain'
      $status = '404 Not Found'
    }
    $head = "HTTP/1.1 $status`r`nContent-Type: $type`r`nContent-Length: $($body.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n"
    $hb = [Text.Encoding]::ASCII.GetBytes($head)
    $stream.Write($hb, 0, $hb.Length)
    $stream.Write($body, 0, $body.Length)
  } catch {
  } finally {
    $client.Close()
  }
}
