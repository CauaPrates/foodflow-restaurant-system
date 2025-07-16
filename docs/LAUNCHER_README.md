# 🚀 Launcher do FoodFlow

Esta é uma aplicação Windows Forms que substitui os scripts batch/PowerShell por uma interface gráfica elegante de controle do FoodFlow.

## ✨ Características

- **Interface de Controle**: Painel de controle intuitivo com detecção automática de status
- **Controle Unificado**: Um único botão para iniciar/parar todo o sistema
- **Detecção Inteligente**: Verifica automaticamente se os serviços estão rodando
- **Feedback Visual**: Status em tempo real com cores indicativas
- **Executável Standalone**: Não precisa do .NET instalado em outras máquinas
- **Sem Terminais**: Nenhuma janela de terminal visível

## 🛠️ Pré-requisitos para Compilação

1. **.NET 6.0 SDK ou superior**
   - Download: https://dotnet.microsoft.com/download
   - Verificar instalação: `dotnet --version`

2. **Node.js** (para executar o sistema)
   - Download: https://nodejs.org/

## 📦 Como Compilar

### Opção 1: Script Automático (Recomendado)
```bash
# PowerShell (Recomendado)
.\build-launcher.ps1

# Ou Batch
build-and-run.bat
```

### Opção 2: Manual
```bash
cd RestauranteLauncher
dotnet build -c Release
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true
```

## 🎯 Como Usar

### Interface de Controle
1. Execute `RestauranteLauncher.exe`
2. A interface mostrará o status atual do sistema:
   - **Sistema parado**: Botão verde "INICIAR SISTEMA"
   - **Sistema rodando**: Botão vermelho "PARAR SISTEMA"
3. Clique no botão para iniciar ou parar o sistema
4. O status é atualizado automaticamente a cada 3 segundos

### Processo de Inicialização
1. **Verificação**: Node.js e dependências
2. **Instalação**: Dependências automáticas (se necessário)
3. **Backend**: Inicia na porta 5000
4. **Frontend**: Inicia na porta 3000
5. **Navegador**: Abre automaticamente em http://localhost:3000

## 📁 Estrutura de Arquivos

```
RestauranteLauncher/
├── Program.cs              # Código principal
├── ControllerForm.cs       # Interface de controle
├── RestauranteLauncher.csproj  # Arquivo de projeto
└── bin/Release/            # Executáveis compilados

RestauranteLauncher.exe     # Executável final
build-launcher.ps1          # Script de compilação
build-and-run.bat          # Script alternativo
```

## 🎨 Interface de Controle

- **Título**: "FoodFlow"
- **Logo**: Ícone azul centralizado
- **Status**: Indicador visual do estado atual ("Sistema parado" / "Sistema rodando")
- **Botão de Controle**: Verde para iniciar, vermelho para parar
- **Atualização Automática**: Status verificado a cada 3 segundos
- **Cores**: Tema escuro profissional

## 🔧 Funcionalidades Técnicas

### Verificações Automáticas
- ✅ Node.js instalado
- ✅ Dependências do backend
- ✅ Dependências do frontend
- ✅ Portas disponíveis

### Processos em Segundo Plano
- ✅ Backend (npm run dev)
- ✅ Frontend (npm start)
- ✅ Sem janelas visíveis
- ✅ Processos independentes

### Tratamento de Erros
- ❌ Node.js não encontrado
- ❌ Falha na instalação de dependências
- ❌ Erro ao iniciar serviços
- ❌ Timeout de inicialização

## 🚫 Para Parar o Sistema

### Método Recomendado
- Use o próprio launcher: clique em "PARAR SISTEMA"

### Métodos Alternativos
Use os scripts existentes:
- `stop-app.bat`
- `stop-app.ps1`

Ou pelo Gerenciador de Tarefas:
- Procure processos "node.exe"
- Finalize os relacionados ao projeto

## 🔄 Vantagens sobre Scripts

| Característica | Scripts Batch/PS | Launcher C# |
|---|---|---|
| Interface | Terminal | GUI Profissional |
| Controle | Manual | Automático |
| Status | Não detecta | Detecção inteligente |
| Experiência | Técnica | User-friendly |
| Distribuição | Requer scripts | Executável único |
| Dependências | .NET opcional | Standalone |

## 🐛 Solução de Problemas

### Erro de Compilação
```bash
# Verificar .NET SDK
dotnet --version

# Limpar e recompilar
dotnet clean
dotnet build
```

### Erro de Execução
- Verificar se Node.js está instalado
- Verificar se as portas 3000 e 5000 estão livres
- Executar como administrador (se necessário)

### Aplicação não Abre
- Verificar antivírus (pode bloquear executável)
- Executar pelo terminal para ver erros:
  ```bash
  .\Sistema-Restaurante.exe
  ```

## 📋 Próximos Passos

1. **Ícone Personalizado**: Adicionar ícone .ico
2. **Configurações**: Arquivo de configuração
3. **Logs**: Sistema de logging
4. **Auto-update**: Verificação de atualizações
5. **Instalador**: Criar MSI/Setup

---

**Nota**: Este launcher substitui completamente os scripts batch e PowerShell, oferecendo uma experiência muito mais profissional e user-friendly.