# Shows the Kubernetes state of all three projects (useful for screenshots).
$Host.UI.RawUI.WindowTitle = 'DevOps Lab - Kubernetes status'
Write-Host "`n===== Cluster node =====" -ForegroundColor Cyan
kubectl get nodes -o wide
Write-Host "`n===== Jenkins (namespace: jenkins) =====" -ForegroundColor Cyan
kubectl -n jenkins get deploy,pods,svc
Write-Host "`n===== Project 1 - CampusEvents (namespace: campusevents) =====" -ForegroundColor Cyan
kubectl -n campusevents get deploy,rs,pods,svc -o wide
kubectl -n campusevents rollout history deployment/campusevents
Write-Host "`n===== Project 2 - Blue-Green (namespace: bluegreen) =====" -ForegroundColor Cyan
kubectl -n bluegreen get deploy -L color
kubectl -n bluegreen get svc -o custom-columns=SERVICE:.metadata.name,ROUTES_TO_COLOUR:.spec.selector.color,NODEPORT:.spec.ports[0].nodePort
kubectl -n bluegreen get pods -L color
Write-Host "`n===== Project 3 - MediSecure (namespace: healthcare) =====" -ForegroundColor Cyan
kubectl get ns healthcare --show-labels
kubectl -n healthcare get deploy,pods,svc,networkpolicy,secret
Write-Host "`n--- Pod security context ---" -ForegroundColor Cyan
kubectl -n healthcare get pod -l app=medisecure -o jsonpath="{range .items[0]}{.spec.securityContext}{'\n'}{.spec.containers[0].securityContext}{'\n'}{end}"
Write-Host ""
