$ErrorActionPreference = "Stop"

$PROJECT_PATH = Split-Path $PSScriptRoot -Parent
$LOCAL_BUILDS_PATH = Join-Path $PROJECT_PATH "local-builds\outputs"
$SERVICE_ACCOUNT_KEY = Join-Path $PROJECT_PATH "local-builds\google-service-key.json"

Write-Host ""
Write-Host "Google Play Store Deployment" -ForegroundColor Cyan
Write-Host ""

# 1. Localizar o arquivo .aab mais recente na pasta outputs
$aabFiles = Get-ChildItem -Path $LOCAL_BUILDS_PATH -Filter "*.aab" | Sort-Object LastWriteTime -Descending

if ($aabFiles.Count -eq 0) {
    Write-Host "Nenhum arquivo .aab encontrado em $LOCAL_BUILDS_PATH" -ForegroundColor Red
    exit 1
}

$latestAab = $aabFiles[0].FullName
Write-Host "Arquivo selecionado: $($aabFiles[0].Name)" -ForegroundColor Green
Write-Host "Data: $($aabFiles[0].LastWriteTime)" -ForegroundColor Gray
Write-Host ""

# 2. Obter Package Name do app.json
$appJson = Get-Content (Join-Path $PROJECT_PATH "app.json") | ConvertFrom-Json
$PACKAGE_NAME = $appJson.expo.android.package

if (!$PACKAGE_NAME) {
    Write-Host "Package Name não encontrado no app.json" -ForegroundColor Red
    exit 1
}

# 3. Executar o Upload via Script Oficial (Node.js + Google SDK)
node ./local-builds/google-play-deploy.js `
    "$PACKAGE_NAME" `
    "$SERVICE_ACCOUNT_KEY" `
    "$latestAab" `
    "internal"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Processo finalizado." -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "Erro durante o deploy." -ForegroundColor Red
    exit 1
}
