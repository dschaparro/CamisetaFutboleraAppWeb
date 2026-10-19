# Pone en .env.local el valor que tengas copiado en el portapapeles.
# Uso: powershell -File scripts/env-desde-portapapeles.ps1 SUPABASE_SECRET_KEY
param([Parameter(Mandatory)][ValidateSet("SUPABASE_SECRET_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_URL")][string]$Variable)

$valor = (Get-Clipboard -Raw).Trim()
$esperado = @{
  SUPABASE_SECRET_KEY                   = '^sb_secret_'
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  = '^sb_publishable_'
  NEXT_PUBLIC_SUPABASE_URL              = '^https://uwitjfaamhhdvwpxpwnt\.supabase\.co$'
}[$Variable]
if ($valor -notmatch $esperado) { Write-Error "El portapapeles no tiene el valor esperado para $Variable. Copialo de nuevo."; exit 1 }

$ruta = Join-Path (Split-Path $PSScriptRoot -Parent) ".env.local"
$texto = [IO.File]::ReadAllText($ruta)
$texto = $texto -replace "(?m)^$Variable=.*$", "$Variable=$valor"
[IO.File]::WriteAllText($ruta, $texto, (New-Object Text.UTF8Encoding($false)))
Write-Host "OK: $Variable actualizado ($($valor.Length) caracteres)."
