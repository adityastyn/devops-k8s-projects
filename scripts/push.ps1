# Commits and pushes local changes to GitHub; Jenkins picks them up within 2 minutes (SCM polling).
$ErrorActionPreference = 'Continue'
Set-Location (Split-Path $PSScriptRoot -Parent)
$log = 'push-log.txt'; Set-Content $log "=== $(Get-Date) ==="
$token = (Get-Content "$HOME\Desktop\GH Token.txt" -Raw).Trim()
$h = @{ Authorization = "token $token"; 'User-Agent' = 'devops-lab' }
$user = (Invoke-RestMethod https://api.github.com/user -Headers $h).login
git add -A
git commit -q -m "Update DevOps lab projects" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`nClaude-Session: https://claude.ai/code/session_01No8f2SpUi4KpHqt1EpLz2E"
$b = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:$token"))
git -c http.extraHeader="Authorization: Basic $b" push -q origin main 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) { Add-Content $log "PUSHED $(git rev-parse --short HEAD)" } else { Add-Content $log 'ERROR: push failed' }
