# One-time setup: push the repo to GitHub, build the Jenkins image and run Jenkins inside Docker Desktop Kubernetes.
$ErrorActionPreference = 'Continue'
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
$log = Join-Path $root 'setup-log.txt'
function Log($m) { $line = "[{0}] {1}" -f (Get-Date -Format 'HH:mm:ss'), $m; Write-Host $line; Add-Content -Path $log -Value $line }
Set-Content -Path $log -Value "=== Setup started $(Get-Date) ==="

try {
  # 1. Kubernetes
  kubectl config use-context docker-desktop 2>&1 | Out-Null
  $ready = $false
  for ($i = 0; $i -lt 60; $i++) {
    $nodes = kubectl get nodes --no-headers 2>$null
    if ($nodes -match ' Ready ') { $ready = $true; break }
    Start-Sleep -Seconds 10
  }
  if (-not $ready) { throw 'Kubernetes is not ready. Enable it in Docker Desktop and run setup again.' }
  Log "KUBERNETES READY: $nodes"

  # 2. GitHub repository
  $token = (Get-Content "$HOME\Desktop\GH Token.txt" -Raw).Trim()
  $h = @{ Authorization = "token $token"; Accept = 'application/vnd.github+json'; 'User-Agent' = 'devops-lab' }
  $user = (Invoke-RestMethod https://api.github.com/user -Headers $h -ErrorAction Stop).login
  $repo = 'devops-k8s-projects'
  try { Invoke-RestMethod "https://api.github.com/repos/$user/$repo" -Headers $h -ErrorAction Stop | Out-Null }
  catch {
    $body = @{ name = $repo; private = $false; description = 'Jenkins + Docker + Kubernetes: CI/CD, Blue-Green deployment and DevSecOps for healthcare' } | ConvertTo-Json
    Invoke-RestMethod https://api.github.com/user/repos -Method Post -Headers $h -Body $body -ErrorAction Stop | Out-Null
    Log "Created GitHub repo $user/$repo"
  }
  if (-not (Test-Path .git)) { git init -b main | Out-Null }
  git config user.name "Aditya Satyanarayanan"
  git config user.email "$user@users.noreply.github.com"
  git config core.autocrlf false
  git add -A
  git diff --cached --quiet
  if ($LASTEXITCODE -ne 0) { git commit -q -m "DevOps lab projects: K8s CI/CD, Blue-Green, DevSecOps" -m "Team: Aditya Satyanarayanan (RA2311003011659), Chirag Khodiyar (RA2311003011664)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`nClaude-Session: https://claude.ai/code/session_01No8f2SpUi4KpHqt1EpLz2E" }
  $b = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:$token"))
  git -c http.extraHeader="Authorization: Basic $b" push -q -u "https://github.com/$user/$repo.git" main 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'git push failed' }
  if (-not (git remote)) { git remote add origin "https://github.com/$user/$repo.git" }
  $repoUrl = "https://github.com/$user/$repo.git"
  Log "PUSHED $repoUrl"

  # 3. Jenkins image
  Log 'Building Jenkins image (first time takes a few minutes)...'
  docker build -t local/jenkins-devops:1 jenkins 2>&1 | Select-Object -Last 3 | ForEach-Object { Log $_ }
  if ($LASTEXITCODE -ne 0) { throw 'Jenkins image build failed' }

  # 4. Deploy Jenkins to Kubernetes
  (Get-Content jenkins\k8s\jenkins.yaml -Raw).Replace('REPO_URL_PLACEHOLDER', $repoUrl) | kubectl apply -f - 2>&1 | ForEach-Object { Log $_ }
  kubectl -n jenkins rollout restart deployment/jenkins 2>&1 | Out-Null
  kubectl -n jenkins rollout status deployment/jenkins --timeout=600s 2>&1 | ForEach-Object { Log $_ }

  # 5. Wait for Jenkins
  for ($i = 0; $i -lt 60; $i++) {
    try { if ((Invoke-WebRequest http://localhost:32000/login -UseBasicParsing -TimeoutSec 5).StatusCode -eq 200) { break } } catch {}
    Start-Sleep -Seconds 5
  }
  Log 'SETUP COMPLETE - Jenkins: http://localhost:32000'
} catch { Log "ERROR: $_" }
