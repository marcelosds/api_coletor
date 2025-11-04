# --------------------------------------------
# Atualizador automático da API COLETOR
# Desenvolvido por Marcelo Souza
# --------------------------------------------

Write-Host "=== Atualizador da API COLETOR ===" -ForegroundColor Cyan

# Caminho da configuração
$configPath = "$env:ProgramData\api_coletor\install_path.txt"

if (-not (Test-Path $configPath)) {
    Write-Host "API não encontrada. Execute primeiro o install.ps1." -ForegroundColor Red
    exit
}

$installPath = Get-Content $configPath

if (-not (Test-Path $installPath)) {
    Write-Host "Pasta de instalação não encontrada: $installPath" -ForegroundColor Red
    exit
}

# Acessar diretório
Set-Location $installPath

Write-Host "Verificando atualizações no GitHub..."
git fetch
$changes = git diff HEAD origin/main

if ($changes) {
    Write-Host "Atualizações encontradas. Aplicando..."
    git pull
    Write-Host "Reinstalando dependências..."
    npm install
    Write-Host "Reiniciando serviço PM2..."
    pm2 restart api_coletor
    Write-Host "✅ API atualizada com sucesso!"
} else {
    Write-Host "Nenhuma atualização disponível." -ForegroundColor Green
}
