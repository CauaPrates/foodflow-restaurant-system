# Script PowerShell para parar o Sistema do Restaurante
Write-Host "=== Parando Sistema do Restaurante ===" -ForegroundColor Red
Write-Host ""

$processesKilled = 0

# Tentar parar usando os PIDs salvos
if (Test-Path "backend.pid") {
    try {
        $backendPid = Get-Content "backend.pid" -ErrorAction SilentlyContinue
        if ($backendPid) {
            Stop-Process -Id $backendPid -Force -ErrorAction SilentlyContinue
            Write-Host "Backend parado (PID: $backendPid)" -ForegroundColor Yellow
            $processesKilled++
        }
        Remove-Item "backend.pid" -ErrorAction SilentlyContinue
    } catch {
        Write-Host "Erro ao parar backend usando PID" -ForegroundColor Red
    }
}

if (Test-Path "frontend.pid") {
    try {
        $frontendPid = Get-Content "frontend.pid" -ErrorAction SilentlyContinue
        if ($frontendPid) {
            Stop-Process -Id $frontendPid -Force -ErrorAction SilentlyContinue
            Write-Host "Frontend parado (PID: $frontendPid)" -ForegroundColor Yellow
            $processesKilled++
        }
        Remove-Item "frontend.pid" -ErrorAction SilentlyContinue
    } catch {
        Write-Host "Erro ao parar frontend usando PID" -ForegroundColor Red
    }
}

# Método alternativo: parar todos os processos Node.js relacionados ao projeto
Write-Host "Verificando processos Node.js relacionados ao projeto..." -ForegroundColor Yellow

try {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*restaurante*" -or 
        $_.CommandLine -like "*backend*npm run dev*" -or 
        $_.CommandLine -like "*frontend*npm start*"
    }
    
    foreach ($process in $nodeProcesses) {
        try {
            Stop-Process -Id $process.Id -Force
            Write-Host "Processo Node.js parado (PID: $($process.Id))" -ForegroundColor Yellow
            $processesKilled++
        } catch {
            Write-Host "Erro ao parar processo $($process.Id)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "Erro ao buscar processos Node.js" -ForegroundColor Red
}

# Parar processos nas portas específicas (método adicional)
Write-Host "Verificando processos nas portas 3000 e 5000..." -ForegroundColor Yellow

try {
    # Porta 3000 (Frontend)
    $port3000 = netstat -ano | findstr ":3000" | ForEach-Object {
        $parts = $_ -split '\s+'
        if ($parts.Length -ge 5) {
            $pid = $parts[4]
            if ($pid -match '^\d+$') {
                try {
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                    Write-Host "Processo na porta 3000 parado (PID: $pid)" -ForegroundColor Yellow
                    $processesKilled++
                } catch { }
            }
        }
    }
    
    # Porta 5000 (Backend)
    $port5000 = netstat -ano | findstr ":5000" | ForEach-Object {
        $parts = $_ -split '\s+'
        if ($parts.Length -ge 5) {
            $pid = $parts[4]
            if ($pid -match '^\d+$') {
                try {
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                    Write-Host "Processo na porta 5000 parado (PID: $pid)" -ForegroundColor Yellow
                    $processesKilled++
                } catch { }
            }
        }
    }
} catch {
    Write-Host "Erro ao verificar portas" -ForegroundColor Red
}

Write-Host ""
if ($processesKilled -gt 0) {
    Write-Host "=== $processesKilled processo(s) parado(s) com sucesso! ===" -ForegroundColor Green
} else {
    Write-Host "=== Nenhum processo encontrado ou já parados ===" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Pressione qualquer tecla para fechar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")