$ErrorActionPreference = "Stop"

$PROJECT_PATH     = "C:\workspace\holy-bible"
$KEYSTORE_PATH    = "$PROJECT_PATH\local-builds\keystore.jks"
$CREDENTIALS_FILE = "$PROJECT_PATH\local-builds\credentials.md"
$STATE_FILE       = "$PROJECT_PATH\local-builds\deploy-state.json"
$APP_JSON_PATH    = "$PROJECT_PATH\app.json"
$KEYSTORE_FILE    = "keystore.jks"

Set-Location $PROJECT_PATH

if (!(Test-Path $KEYSTORE_PATH))    { Write-Host "Keystore nao encontrado: $KEYSTORE_PATH" -ForegroundColor Red; exit 1 }
if (!(Test-Path $CREDENTIALS_FILE)) { Write-Host "Credenciais nao encontradas: $CREDENTIALS_FILE" -ForegroundColor Red; exit 1 }

# Versao interativa (leitura via Node para preservar encoding)
$appJson        = node -e "const d=JSON.parse(require('fs').readFileSync('app.json'));console.log(JSON.stringify({v:d.expo.version,c:d.expo.android.versionCode}))" | ConvertFrom-Json
$currentVersion = $appJson.v
$currentCode    = $appJson.c

Write-Host ""
Write-Host "  Versao atual:   $currentVersion   (versionCode: $currentCode)" -ForegroundColor Yellow
$inputVersion = Read-Host "  Nova versao     [Enter = manter]"
$newVersion = if ($inputVersion.Trim() -ne '') { $inputVersion.Trim() } else { $currentVersion }

# versionCode automatico via deploy-state
$state = if (Test-Path $STATE_FILE) {
    Get-Content $STATE_FILE -Raw | ConvertFrom-Json
} else {
    [PSCustomObject]@{ deployed = $true }
}

if ($state.deployed -eq $true) {
    $newCode = $currentCode + 1
    Write-Host "  versionCode:    $currentCode -> $newCode" -ForegroundColor Cyan
    '{"deployed":false}' | Set-Content $STATE_FILE -Encoding UTF8
} else {
    $newCode = $currentCode
    Write-Host "  versionCode:    $currentCode (retry - sem incremento)" -ForegroundColor Gray
}

# Atualizar app.json via Node (preserva encoding e formatacao)
$nodeScript = "const fs=require('fs'),f='app.json',d=JSON.parse(fs.readFileSync(f));d.expo.version='$newVersion';d.expo.android.versionCode=$newCode;fs.writeFileSync(f,JSON.stringify(d,null,2)+'\n')"
node -e $nodeScript
Write-Host ""

# Barra de progresso
function Show-Step {
    param([int]$Step, [int]$Total, [string]$Label)
    $width  = 40
    $filled = [math]::Round(($Step / $Total) * $width)
    $empty  = $width - $filled
    $bar    = ([string][char]0x2588 * $filled) + ([string][char]0x2591 * $empty)
    Write-Host ""
    Write-Host "  $bar" -ForegroundColor Cyan
    Write-Host "  $Label" -ForegroundColor White
}

# Credenciais
$creds          = Get-Content $CREDENTIALS_FILE -Raw
$STORE_PASSWORD = ([regex]::Match($creds, 'Android upload keystore password:\s*(.+)')).Groups[1].Value.Trim()
$KEY_ALIAS      = ([regex]::Match($creds, 'Android key alias:\s*(.+)')).Groups[1].Value.Trim()
$KEY_PASSWORD   = ([regex]::Match($creds, 'Android key password:\s*(.+)')).Groups[1].Value.Trim()

Show-Step 1 3 "Preparando projeto..."

# CI=1 e EXPO_NO_GIT_STATUS=1 suprimem prompts e avisos do Expo
$env:CI = "1"
$env:EXPO_NO_GIT_STATUS = "1"
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force

# Usar $ErrorActionPreference = Continue para o prebuild pois
# NativeCommandError ocorre quando o node escreve no stderr (aviso de git, etc.)
$ErrorActionPreference = "Continue"
npx expo prebuild --clean 2>&1 | Out-Null
$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path "android\app" | Out-Null
Copy-Item $KEYSTORE_PATH "android\app\$KEYSTORE_FILE" -Force

Show-Step 2 3 "Compilando AAB..."

$KEYSTORE_FULL = "$PROJECT_PATH\android\app\$KEYSTORE_FILE"

Set-Location "$PROJECT_PATH\android"

.\gradlew.bat bundleRelease --quiet `
    "-Pandroid.injected.signing.store.file=$KEYSTORE_FULL" `
    "-Pandroid.injected.signing.store.password=$STORE_PASSWORD" `
    "-Pandroid.injected.signing.key.alias=$KEY_ALIAS" `
    "-Pandroid.injected.signing.key.password=$KEY_PASSWORD"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro na compilacao." -ForegroundColor Red
    Set-Location $PROJECT_PATH
    exit 1
}

Set-Location $PROJECT_PATH

$AAB_PATH = "$PROJECT_PATH\android\app\build\outputs\bundle\release\app-release.aab"
if (!(Test-Path $AAB_PATH)) {
    Write-Host "AAB nao encontrado." -ForegroundColor Red
    exit 1
}

# Validar assinatura
$aabCertLines = keytool -printcert -jarfile "$AAB_PATH" 2>&1
$aabSHA1      = ($aabCertLines | Select-String 'SHA1:' | Select-Object -First 1).ToString().Trim() -replace '.*SHA1:\s*', ''

$jksCertLines = keytool -list -v -keystore "$KEYSTORE_PATH" -alias "$KEY_ALIAS" -storepass "$STORE_PASSWORD" 2>&1
$keystoreSHA1 = ($jksCertLines | Select-String 'SHA1:' | Select-Object -First 1).ToString().Trim() -replace '.*SHA1:\s*', ''

if ($aabSHA1 -ne $keystoreSHA1) {
    Write-Host ""
    Write-Host "ERRO: AAB assinado com chave incorreta!" -ForegroundColor Red
    Write-Host "  AAB:      $aabSHA1" -ForegroundColor Yellow
    Write-Host "  Esperado: $keystoreSHA1" -ForegroundColor Yellow
    exit 1
}

# Copiar para outputs
$OUTPUT_DIR = "$PROJECT_PATH\local-builds\outputs"
if (!(Test-Path $OUTPUT_DIR)) {
    New-Item -ItemType Directory -Force -Path $OUTPUT_DIR | Out-Null
}

$TIMESTAMP   = Get-Date -Format "yyyy-MM-dd-HH-mm"
$FILENAME    = "$TIMESTAMP-holy-bible.aab"
$DESTINATION = "$OUTPUT_DIR\$FILENAME"
Copy-Item $AAB_PATH $DESTINATION -Force

Show-Step 3 3 "Build pronto. Iniciando envio..."
