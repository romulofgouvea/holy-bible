param([string]$Track = "internal")

$ErrorActionPreference = "Stop"

$PROJECT_PATH = Split-Path $PSScriptRoot -Parent
$LOCAL_BUILDS_PATH = Join-Path $PROJECT_PATH "local-builds\outputs"
$SERVICE_ACCOUNT_KEY = Join-Path $PROJECT_PATH "local-builds\google-service-key.json"

$trackMap = @{ "preview" = "internal"; "production" = "production"; "internal" = "internal"; "beta" = "beta" }
$playTrack = if ($trackMap.ContainsKey($Track)) { $trackMap[$Track] } else { $Track }

$aabFiles = Get-ChildItem -Path $LOCAL_BUILDS_PATH -Filter "*.aab" | Sort-Object LastWriteTime -Descending
if ($aabFiles.Count -eq 0) { Write-Host "Nenhum .aab encontrado em $LOCAL_BUILDS_PATH" -ForegroundColor Red; exit 1 }

$latestAab = $aabFiles[0].FullName
$appJson = Get-Content (Join-Path $PROJECT_PATH "app.json") | ConvertFrom-Json
$PACKAGE_NAME = $appJson.expo.android.package

node ./local-builds/google-play-deploy.js "$PACKAGE_NAME" "$SERVICE_ACCOUNT_KEY" "$latestAab" "$playTrack"

if ($LASTEXITCODE -ne 0) { exit 1 }

# Deploy bem-sucedido - libera incremento de versionCode no próximo build
'{"deployed":true}' | Set-Content "$PROJECT_PATH\local-builds\deploy-state.json" -Encoding UTF8

