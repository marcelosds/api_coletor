# ============================================
# Atualizador automático da API COLETOR
# ============================================

Write-Host "=== Atualizador da API COLETOR ===" -ForegroundColor Cyan

# Caminho de instalação
$installPath = "C:\api_coletor"

# Verifica se a pasta da API existe
if (-not (Test-Path $installPath)) {
    Write-Host "A pasta $installPath não foi encontrada." -ForegroundColor Red
    Write-Host "Execute primeiro o instalador (install.ps1)." -ForegroundColor Yellow
    exit
}

# Entra na pasta
Set-Location $installPath

# Faz backup do arquivo .env antes da atualização
$envFile = Join-Path $installPath ".env"
$backupFile = Join-Path $installPath ".env.backup"

if (Test-Path $envFile) {
    Copy-Item $envFile $backupFile -Force
    Write-Host "Backup do arquivo .env criado." -ForegroundColor Yellow
}

Write-Host "Finalizando processos PM2 e Node.js..." -ForegroundColor Yellow
try {
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    pm2 delete api_coletor | Out-Null
    pm2 kill | Out-Null
    Start-Sleep -Seconds 3
} catch {
    Write-Host "Nenhum processo ativo encontrado." -ForegroundColor DarkYellow
}

# Atualiza o repositório sem perder o .env do repositório
Write-Host "Atualizando código a partir do GitHub..." -ForegroundColor Cyan
try {
    git fetch origin main
    git reset --hard origin/main
    Write-Host "Repositório atualizado com sucesso." -ForegroundColor Green
} catch {
    Write-Host "Erro ao atualizar o repositório. Verifique sua conexão ou permissões." -ForegroundColor Red
    exit
}

# Restaura o arquivo .env exatamente como está no repositório
if (Test-Path $backupFile) {
    # Verifica se o .env foi alterado no repositório
    $repoEnv = Join-Path $installPath ".env"
    if ((Get-FileHash $backupFile).Hash -ne (Get-FileHash $repoEnv).Hash) {
        Write-Host "O arquivo .env foi alterado localmente — mantendo versão do repositório." -ForegroundColor Cyan
        # Mantém o .env do repositório exatamente como está
    } else {
        Write-Host "Nenhuma diferença detectada no .env." -ForegroundColor DarkGray
    }
    Remove-Item $backupFile -Force
}

# Atualiza dependências se necessário
Write-Host "Verificando e atualizando dependências npm..." -ForegroundColor Cyan
npm install

# Reinicia serviço no PM2
Write-Host "Reiniciando serviço no PM2..." -ForegroundColor Cyan
pm2 start "$installPath\src\server.js" --name "api_coletor"
pm2 save
pm2 startup | Out-Null

Write-Host "Atualização concluída com sucesso!" -ForegroundColor Green
