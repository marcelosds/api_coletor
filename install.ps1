# ============================================
# Instalador automático da API COLETOR
# ============================================

Write-Host "=== Instalador da API COLETOR ===" -ForegroundColor Cyan

# Caminho de instalação
$installPath = "C:\api_coletor"

# Repositório GitHub
$repoUrl = "https://github.com/marcelosds/api_coletor.git"

# Verifica se já existe instalação
if (Test-Path $installPath) {
    $response = Read-Host "A pasta $installPath já existe. Deseja sobrescrever? (S/N)"
    if ($response -eq "S" -or $response -eq "s") {

        Write-Host "Finalizando processos PM2 e Node.js..." -ForegroundColor Yellow
        try {
            # Finaliza todos os processos Node e PM2
            Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
            pm2 kill | Out-Null
            Start-Sleep -Seconds 3
        } catch {
            Write-Host "Nenhum processo ativo encontrado." -ForegroundColor DarkYellow
        }

        Write-Host "Removendo pasta antiga..." -ForegroundColor Yellow
        try {
            Remove-Item -Recurse -Force $installPath
        } catch {
            Write-Host "Erro ao remover a pasta. Verifique se nenhum programa está usando o diretório e tente novamente." -ForegroundColor Red
            exit
        }
    } else {
        Write-Host "Instalação cancelada." -ForegroundColor Red
        exit
    }
}

# Clona o repositório
Write-Host "Clonando repositório da API..." -ForegroundColor Cyan
git clone $repoUrl $installPath

# Entra na pasta
Set-Location $installPath

# Instala dependências
Write-Host "Instalando dependências npm..." -ForegroundColor Cyan
npm install

# Instala PM2 (caso não tenha)
Write-Host "Verificando PM2..." -ForegroundColor Cyan
if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
    npm install -g pm2
}

# Configura o PM2 para rodar a API como serviço
Write-Host "Configurando serviço no PM2..." -ForegroundColor Cyan
pm2 start "$installPath\src\server.js" --name "api_coletor"
pm2 save
pm2 startup | Out-Null

Write-Host "====================================="
Write-Host "✅ Instalação concluída com sucesso!"
Write-Host "A API COLETOR está rodando via PM2."
Write-Host "Para verificar o status: pm2 list"
Write-Host "====================================="
