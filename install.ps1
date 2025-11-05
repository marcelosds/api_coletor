# ============================================
# Instalador automático da API COLETOR
# ============================================

Write-Host "=== Instalador da API COLETOR ===" -ForegroundColor Cyan

# Caminho de instalação
$installPath = "C:\api_coletor"

# Repositório GitHub
# URL do repositório (ajuste para o seu GitHub)
$repoUrl = "https://github.com/marcelosds/api_coletor.git"

# Verifica se já existe instalação
if (Test-Path $installPath) {
    Write-Host "Pasta de instalação existente. Preparando atualização limpa..." -ForegroundColor Yellow
    try {
        # Finaliza todos os processos Node e PM2
        Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
        pm2 delete api_coletor | Out-Null
        pm2 kill | Out-Null
        Start-Sleep -Seconds 2
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

# Criar .env automaticamente se não existir, usando valores padrão seguros
$envFile = Join-Path $installPath "api\.env"
if (-not (Test-Path $envFile)) {
    Write-Host "Gerando arquivo .env padrão..." -ForegroundColor Cyan
    $envContent = @"
# Configurações do Servidor
PORT=3000
NODE_ENV=production

# JWT Configuration
JWT_SECRET=$(New-Guid)
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=*

# Database Configuration
DB_PATH=./data/database.sqlite

# Firebase Admin Credentials (opcional; deixe vazio para desabilitar integrações)
FIREBASE_CREDENTIALS_PATH=
FIREBASE_SERVICE_ACCOUNT_JSON=
FIREBASE_DATABASE_URL=https://coletoroficial-default-rtdb.firebaseio.com
"@
    New-Item -ItemType Directory -Force -Path (Join-Path $installPath "api") | Out-Null
    Set-Content -Path $envFile -Value $envContent -Encoding UTF8
}

Write-Host "====================================="
Write-Host "✅ Instalação concluída com sucesso!"
Write-Host "A API COLETOR está rodando via PM2."
Write-Host "Para verificar o status: pm2 list"
Write-Host "====================================="
