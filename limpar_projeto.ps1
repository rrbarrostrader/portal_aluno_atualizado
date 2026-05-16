# Script de Limpeza - Portal Acadêmico (Windows PowerShell)
# Execute este script na raiz do seu projeto para remover arquivos redundantes

Write-Host "Iniciando limpeza de arquivos redundantes..." -ForegroundColor Cyan

$filesToRemove = @(
    "server/auth_funciona.ts",
    "server/auth_funciona2.ts",
    "server/auth_manusemail1.ts",
    "server/routers_funciona.ts",
    "server/routers_funciona (2).ts",
    "server/routers0905.ts",
    "server/routers_2904.ts",
    "setup_database.sql",
    "setup_database_v.sql",
    "setup_database_v2.sql"
)

foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "Removido: $file" -ForegroundColor Green
    } else {
        Write-Host "Arquivo não encontrado (já removido): $file" -ForegroundColor Yellow
    }
}

Write-Host "Limpeza concluída com sucesso!" -ForegroundColor Cyan
