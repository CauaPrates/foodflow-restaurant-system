@echo off
echo Iniciando Sistema do Restaurante...
echo.

REM Verificar se o Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js não encontrado. Por favor, instale o Node.js primeiro.
    pause
    exit /b 1
)

REM Verificar se as dependências estão instaladas
if not exist "backend\node_modules" (
    echo Instalando dependências do backend...
    cd backend
    npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo Instalando dependências do frontend...
    cd frontend
    npm install
    cd ..
)

echo Iniciando backend em segundo plano...
start /min "Backend" cmd /c "cd backend && npm run dev"

echo Aguardando backend inicializar...
timeout /t 5 /nobreak >nul

echo Iniciando frontend em segundo plano...
start /min "Frontend" cmd /c "cd frontend && npm start"

echo Aguardando frontend inicializar...
timeout /t 10 /nobreak >nul

echo Abrindo navegador...
start http://localhost:3000

echo.
echo Sistema iniciado com sucesso!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Os serviços estão rodando em segundo plano.
echo Para parar os serviços, execute: stop-app.bat
echo.
echo Pressione qualquer tecla para fechar este terminal...
pause >nul