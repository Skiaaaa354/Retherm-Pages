# Minimaler statischer Webserver für die lokale Vorschau (kein Node/Python nötig)
$port = 8123
$root = Split-Path -Parent $PSScriptRoot

$mime = @{
  '.html'  = 'text/html; charset=utf-8'
  '.css'   = 'text/css; charset=utf-8'
  '.js'    = 'application/javascript; charset=utf-8'
  '.svg'   = 'image/svg+xml'
  '.woff2' = 'font/woff2'
  '.png'   = 'image/png'
  '.jpg'   = 'image/jpeg'
  '.jpeg'  = 'image/jpeg'
  '.webp'  = 'image/webp'
  '.ico'   = 'image/x-icon'
  '.json'  = 'application/json; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Output "Serving $root at http://localhost:$port/"

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $res = $ctx.Response
  try {
    $rel = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath).TrimStart('/')
    if ($rel -eq '') { $rel = 'index.html' }
    $path = Join-Path $root $rel
    $full = [System.IO.Path]::GetFullPath($path)
    if (-not $full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
      $res.StatusCode = 403
    } elseif (Test-Path $full -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($full).ToLower()
      $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
      Write-Output "200 $rel"
    } else {
      $res.StatusCode = 404
      Write-Output "404 $rel"
    }
  } catch {
    try { $res.StatusCode = 500 } catch {}
    Write-Output "500 $($_.Exception.Message)"
  } finally {
    $res.Close()
  }
}
