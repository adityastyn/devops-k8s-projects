# DevOps Lab Projects – Jenkins, Docker and Kubernetes

**Subject:** Essentials in Cloud and DevOps
**Team:** Aditya Satyanarayanan (RA2311003011659) · Chirag Khodiyar (RA2311003011664)

All three projects run on a local Kubernetes cluster (Docker Desktop, kubeadm). Jenkins also runs inside that cluster and builds images with the node's Docker engine, so new images are immediately available to Kubernetes.

| # | Project | Folder | Jenkins job | App URL |
|---|---|---|---|---|
| 7 | CI/CD pipeline to deploy a Dockerized app on Kubernetes using Jenkins | `p1-k8s-cicd` | `P1-K8s-CICD` | http://localhost:30080 |
| 8 | Automated Blue-Green deployment using Jenkins, Kubernetes and Docker | `p2-bluegreen-k8s` | `P2-BlueGreen-K8s` | live http://localhost:30081 · preview http://localhost:30082 |
| 9 | Secure DevOps (DevSecOps) in a healthcare system | `p3-devsecops-healthcare` | `P3-DevSecOps-Healthcare` | http://localhost:30090 |

Jenkins: **http://localhost:32000**

## Setup (Windows + Docker Desktop)
1. Docker Desktop → Kubernetes → Create cluster (kubeadm).
2. Double-click `SETUP.cmd` – pushes this repo to GitHub, builds the Jenkins image (`jenkins/`) and deploys Jenkins to the `jenkins` namespace. Jenkins is configured as code (`jenkins/casc.yaml`) and creates all three pipeline jobs, which poll GitHub every 2 minutes.
3. `STATUS.cmd` prints the Kubernetes state of all projects; `SHOW-P3-KEY.cmd` reads the MediSecure access key from its Kubernetes Secret.

## Project 1 – CI/CD to Kubernetes
Checkout → Unit tests (Docker `test` stage) → Build image `campusevents:<build>` → `kubectl apply` (3 replicas, RollingUpdate with maxUnavailable 0, readiness/liveness probes) → `rollout status` → smoke test through the Service. On failure: `kubectl rollout undo`.

## Project 2 – Blue-Green on Kubernetes
Two Deployments (`brewbox-blue`, `brewbox-green`) and two Services: `brewbox-live` (NodePort 30081) and `brewbox-preview` (30082). Each build deploys to the idle colour, tests it through the preview Service, then switches the live Service selector (`kubectl patch`) and verifies. The previous colour keeps running for instant rollback (`ACTION=rollback` parameter).

## Project 3 – DevSecOps for healthcare
MediSecure patient-records API with API-key auth (key in a Kubernetes Secret), PHI masking, strict security headers/CSP, rate limiting and JSON audit logs. Pipeline security gates: Gitleaks (secrets) → Semgrep (SAST) → Hadolint (Dockerfile) → unit & security tests → Trivy image scan (blocks fixable HIGH/CRITICAL) → Trivy Kubernetes config scan → deploy to a namespace enforcing the **restricted** Pod Security Standard (non-root, read-only root FS, all capabilities dropped, seccomp, NetworkPolicy) → OWASP ZAP baseline DAST. All reports are archived as Jenkins build artifacts.
