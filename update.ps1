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

Write-Host "Finalizando processos PM2 e Node.js..." -ForegroundColor Yellow
try {
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    pm2 delete api_coletor | Out-Null
    pm2 kill | Out-Null
    Start-Sleep -Seconds 3
} catch {
    Write-Host "Nenhum processo ativo encontrado." -ForegroundColor DarkYellow
}

# Atualiza o repositório
Write-Host "Atualizando código a partir do GitHub..." -ForegroundColor Cyan
try {
    git reset --hard HEAD
    git pull origin main
} catch {
    Write-Host "Erro ao atualizar o repositório. Verifique sua conexão ou permissões." -ForegroundColor Red
    exit
}

# Reinstala dependências se necessário
Write-Host "Verificando e atualizando dependências npm..." -ForegroundColor Cyan
npm install

# Reinicia o serviço no PM2
Write-Host "Reiniciando serviço no PM2..." -ForegroundColor Cyan
pm2 start "$installPath\src\server.js" --name "api_coletor"
pm2 save
pm2 startup | Out-Null

Write-Host "====================================="
Write-Host "✅ Atualização concluída com sucesso!"
Write-Host "A API COLETOR está rodando via PM2."
Write-Host "Para verificar o status: pm2 list"
Write-Host "====================================="
