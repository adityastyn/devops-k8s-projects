# Reads the MediSecure access key from its Kubernetes Secret (it is never stored in Git or printed by Jenkins).
$Host.UI.RawUI.WindowTitle = 'MediSecure access key (from Kubernetes Secret)'
$b64 = kubectl -n healthcare get secret medisecure-api-key -o jsonpath="{.data.API_KEY}"
if (-not $b64) { Write-Host 'Secret not found - run the P3 pipeline first.' -ForegroundColor Red; return }
$key = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($b64))
Write-Host "`nkubectl -n healthcare get secret medisecure-api-key" -ForegroundColor Cyan
kubectl -n healthcare get secret medisecure-api-key
Write-Host "`nAccess key for http://localhost:30090 :" -ForegroundColor Cyan
Write-Host $key -ForegroundColor Yellow
Set-Clipboard -Value $key
Write-Host "(copied to clipboard)`n"
Write-Host "Recent audit log entries:" -ForegroundColor Cyan
kubectl -n healthcare logs deploy/medisecure --tail=8
