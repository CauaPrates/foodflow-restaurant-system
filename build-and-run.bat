@echo off
echo Compilando aplicacao do Sistema do Restaurante...
echo.

REM Verificar se o .NET SDK está instalado
dotnet --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: .NET SDK não encontrado.
    echo Por favor, instale o .NET 6.0 SDK ou superior.
    echo Download: https://dotnet.microsoft.com/download
    pause
    exit /b 1
)

REM Navegar para o diretório do projeto
cd RestauranteLauncher

REM Compilar o projeto
echo Compilando...
dotnet build -c Release
if %errorlevel% neq 0 (
    echo ERRO: Falha na compilacao.
    pause
    exit /b 1
)

echo Compilacao concluida com sucesso!
echo.
echo Executando aplicacao...
echo.

REM Executar a aplicação
dotnet run -c Release

cd ..
pause