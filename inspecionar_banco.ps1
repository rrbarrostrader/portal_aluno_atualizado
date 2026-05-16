# Script de Inspeção de Banco de Dados - Portal Acadêmico
# Este script extrai a estrutura real das tabelas para análise do "Super Programador"

Write-Host "--- INSPEÇÃO DE ESTRUTURA DE TABELAS ---" -ForegroundColor Cyan

# Comando para listar as colunas da tabela grades com detalhes de maiúsculas/minúsculas
$query = "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name IN ('grades', 'subjects', 'enrollments') ORDER BY table_name, ordinal_position;"

Write-Host "Executando consulta no PostgreSQL..." -ForegroundColor Yellow
Write-Host "Por favor, copie o resultado abaixo e me envie:" -ForegroundColor Green
Write-Host "------------------------------------------------"

# Tentativa de executar via psql (assumindo que está no PATH do Windows)
# Se o usuário não tiver psql no path, ele pode precisar ajustar o comando
psql -U postgres -d iab_fapegma_portal -c "$query"

Write-Host "------------------------------------------------"
Write-Host "Se o comando acima falhou, certifique-se de que o PostgreSQL está no seu PATH e o nome do banco está correto." -ForegroundColor Red
