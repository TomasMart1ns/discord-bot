# Cria um ZIP para deploy SEM node_modules nem .git (respeita o limite de ficheiros do VetraCloud)
$pasta = Split-Path -Parent $MyInvocation.MyCommand.Path
$destino = Join-Path $pasta "discord-bot-deploy.zip"

# Remover zip anterior
if (Test-Path $destino) { Remove-Item $destino -Force }

# Pastas/ficheiros a NAO incluir (node_modules e .git excedem o limite de 10000 ficheiros)
$excluir = @("node_modules", ".git", "discord-bot-deploy.zip", "criar-zip-deploy.ps1", ".vetracloudignore", "FIREBASE_CONFIG.json", "dados.json")
$itens = Get-ChildItem -Path $pasta -Force | Where-Object { $excluir -notcontains $_.Name }

$tempPasta = Join-Path $env:TEMP "discord-bot-deploy-temp"
if (Test-Path $tempPasta) { Remove-Item $tempPasta -Recurse -Force }
New-Item -ItemType Directory -Path $tempPasta | Out-Null

foreach ($item in $itens) {
    Copy-Item -Path $item.FullName -Destination $tempPasta -Recurse -Force
}

Compress-Archive -Path "$tempPasta\*" -DestinationPath $destino -Force
Remove-Item $tempPasta -Recurse -Force

Write-Host "ZIP criado: $destino" -ForegroundColor Green
Write-Host "Ficheiros no ZIP:" (Get-ChildItem -Path $destino | Measure-Object).Count
# Contar ficheiros dentro do zip
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($destino)
$total = $zip.Entries.Count
$zip.Dispose()
Write-Host "Total de entradas no ZIP: $total (limite: 10000)" -ForegroundColor Cyan
