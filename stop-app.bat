@echo off
echo Parando Sistema do Restaurante...
echo.

REM Parar processos Node.js relacionados ao projeto
echo Parando backend...
taskkill /f /im node.exe /fi "WINDOWTITLE eq Backend*" 2>nul
taskkill /f /im node.exe /fi "COMMANDLINE eq *backend*npm run dev*" 2>nul

echo Parando frontend...
taskkill /f /im node.exe /fi "WINDOWTITLE eq Frontend*" 2>nul
taskkill /f /im node.exe /fi "COMMANDLINE eq *frontend*npm start*" 2>nul

REM Método alternativo - parar todos os processos node que contenham 'restaurante' no caminho
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv ^| findstr /i "restaurante"') do (
    taskkill /f /pid %%i 2>nul
)

echo.
echo Serviços parados com sucesso!
echo.
echo Pressione qualquer tecla para fechar...
pause >nul