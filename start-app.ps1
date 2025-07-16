# Script PowerShell para iniciar o Sistema do Restaurante
Write-Host "=== Sistema do Restaurante ===" -ForegroundColor Green
Write-Host "Iniciando aplicação..." -ForegroundColor Yellow
Write-Host ""

# Verificar se o Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERRO: Node.js não encontrado. Por favor, instale o Node.js primeiro." -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar e instalar dependências do backend
if (!(Test-Path "backend\node_modules")) {
    Write-Host "Instalando dependências do backend..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
    Write-Host "Dependências do backend instaladas!" -ForegroundColor Green
}

# Verificar e instalar dependências do frontend
if (!(Test-Path "frontend\node_modules")) {
    Write-Host "Instalando dependências do frontend..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
    Write-Host "Dependências do frontend instaladas!" -ForegroundColor Green
}

# Iniciar backend em segundo plano
Write-Host "Iniciando backend em segundo plano..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath "cmd" -ArgumentList "/c", "cd backend && npm run dev" -WindowStyle Hidden -PassThru

# Aguardar backend inicializar
Write-Host "Aguardando backend inicializar..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Iniciar frontend em segundo plano
Write-Host "Iniciando frontend em segundo plano..." -ForegroundColor Yellow
$frontendProcess = Start-Process -FilePath "cmd" -ArgumentList "/c", "cd frontend && npm start" -WindowStyle Hidden -PassThru

# Aguardar frontend inicializar
Write-Host "Aguardando frontend inicializar..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Abrir navegador
Write-Host "Abrindo navegador..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"

# Salvar IDs dos processos para poder pará-los depois
$backendProcess.Id | Out-File -FilePath "backend.pid" -Encoding ASCII
$frontendProcess.Id | Out-File -FilePath "frontend.pid" -Encoding ASCII

Write-Host ""
Write-Host "=== Sistema iniciado com sucesso! ===" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Os serviços estão rodando em segundo plano." -ForegroundColor Green
Write-Host "Para parar os serviços, execute: .\stop-app.ps1" -ForegroundColor Yellow
Write-Host "IDs dos processos salvos em backend.pid e frontend.pid" -ForegroundColor Gray
Write-Host ""
Write-Host "Pressione qualquer tecla para fechar este script..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")