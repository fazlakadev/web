param([int]$Port = 3002, [switch]$NoBuild)

# Clean build + restart a Next.js standalone app on the given port.
# Usage: .\deploy.ps1 [-Port 3000] [-NoBuild]

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

# 1. Stop whatever is listening on $Port (usually a previous standalone server)
$conns = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $Port }
foreach ($c in $conns) {
  Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 1

# 2. Clean build (delete .next so stale chunks can never leak into a new build)
if (-not $NoBuild) {
  try {
    Remove-Item -Path ".next" -Recurse -Force -ErrorAction Stop
  } catch {
    Start-Sleep -Seconds 2
    Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
  }
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "Build failed" }
}

# 3. Copy static + public assets into the standalone output (Next.js requirement)
$std = Join-Path $root ".next\standalone"
if (Test-Path ".next\static") {
  $dst = Join-Path $std ".next\static"
  New-Item -ItemType Directory -Path $dst -Force | Out-Null
  Copy-Item ".next\static\*" $dst -Recurse -Force
}
if (Test-Path "public") {
  $dst = Join-Path $std "public"
  New-Item -ItemType Directory -Path $dst -Force | Out-Null
  Copy-Item "public\*" $dst -Recurse -Force
}

# 4. Start the standalone server
$env:PORT = "$Port"
$env:HOSTNAME = "0.0.0.0"
Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $std -WindowStyle Hidden `
  -RedirectStandardOutput (Join-Path $std "server.out.log") `
  -RedirectStandardError (Join-Path $std "server.err.log")

Start-Sleep -Seconds 2
Write-Output "Next.js standalone started on port $Port (build: $(-not $NoBuild))"
