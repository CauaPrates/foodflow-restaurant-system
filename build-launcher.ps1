# Script para compilar o Launcher do Sistema do Restaurante
Write-Host "=== Compilador do Sistema do Restaurante ===" -ForegroundColor Green
Write-Host ""

# Verificar se o .NET SDK está instalado
try {
    $dotnetVersion = dotnet --version
    Write-Host "✓ .NET SDK encontrado: $dotnetVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ ERRO: .NET SDK não encontrado." -ForegroundColor Red
    Write-Host "Por favor, instale o .NET 6.0 SDK ou superior." -ForegroundColor Yellow
    Write-Host "Download: https://dotnet.microsoft.com/download" -ForegroundColor Cyan
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Navegar para o diretório do projeto
Set-Location RestauranteLauncher

Write-Host "Compilando aplicação..." -ForegroundColor Yellow
Write-Host ""

# Compilar versão Release
try {
    dotnet build -c Release --verbosity quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Compilação concluída com sucesso!" -ForegroundColor Green
    } else {
        throw "Erro na compilação"
    }
} catch {
    Write-Host "✗ ERRO: Falha na compilação." -ForegroundColor Red
    Set-Location ..
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host ""
Write-Host "Criando executável standalone..." -ForegroundColor Yellow

# Criar executável standalone (self-contained)
try {
    dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:PublishTrimmed=true --verbosity quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Executável criado com sucesso!" -ForegroundColor Green
    } else {
        throw "Erro na publicação"
    }
} catch {
    Write-Host "✗ ERRO: Falha ao criar executável." -ForegroundColor Red
    Set-Location ..
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Voltar ao diretório raiz
Set-Location ..

# Copiar executável para o diretório raiz
$sourcePath = "RestauranteLauncher\bin\Release\net6.0-windows\win-x64\publish\RestauranteLauncher.exe"
$destPath = "Sistema-Restaurante.exe"

if (Test-Path $sourcePath) {
    Copy-Item $sourcePath $destPath -Force
    Write-Host "✓ Executável copiado para: $destPath" -ForegroundColor Green
} else {
    Write-Host "✗ ERRO: Executável não encontrado em $sourcePath" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Compilação Finalizada ===" -ForegroundColor Green
Write-Host ""
Write-Host "Para executar o sistema:" -ForegroundColor Cyan
Write-Host "1. Clique duas vezes em 'Sistema-Restaurante.exe'" -ForegroundColor White
Write-Host "2. Ou execute: .\Sistema-Restaurante.exe" -ForegroundColor White
Write-Host ""
Write-Host "O executável é standalone e não precisa do .NET instalado em outras máquinas." -ForegroundColor Yellow
Write-Host ""
Read-Host "Pressione Enter para sair"