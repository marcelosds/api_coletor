# --------------------------------------------
# Instalador automático da API COLETOR
# Desenvolvido por Marcelo Souza
# --------------------------------------------

Write-Host "=== Instalador da API COLETOR ===" -ForegroundColor Cyan

# Caminho padrão de instalação
$installPath = "C:\api_coletor"

# Repositório GitHub
$repoUrl = "https://github.com/marcelosds/api_coletor.git"

# Se a pasta já existir, perguntar se deseja sobrescrever
if (Test-Path $installPath) {
    $response = Read-Host "A pasta $installPath já existe. Deseja sobrescrever? (S/N)"
    if ($response -ne "S") {
        Write-Host "Instalação cancelada." -ForegroundColor Yellow
        exit
    }
    Remove-Item -Recurse -Force $installPath
}

# Clonar o repositório
Write-Host "Clonando repositório..."
git clone $repoUrl $installPath

# Acessar diretório
Set-Location $installPath

# Instalar dependências
Write-Host "Instalando dependências NPM..."
npm install

# Criar arquivo .env se não existir
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "Arquivo .env criado a partir do modelo."
    } else {
        Write-Host "Arquivo .env não encontrado. Crie manualmente depois." -ForegroundColor Yellow
    }
}

# Instalar PM2 globalmente (para rodar como serviço)
npm install pm2 -g

# Iniciar API com PM2
pm2 start npm --name "api_coletor" -- start
pm2 save

# Criar arquivo de configuração local
$configPath = "$env:ProgramData\api_coletor"
if (-not (Test-Path $configPath)) { New-Item -ItemType Directory -Path $configPath | Out-Null }
Set-Content -Path "$configPath\install_path.txt" -Value $installPath

Write-Host "✅ Instalação concluída com sucesso!"
Write-Host "A API está em execução e será iniciada automaticamente pelo PM2."
Write-Host "Para atualizar futuramente, execute o arquivo update.ps1"
