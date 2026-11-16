$ErrorActionPreference = 'Stop'

$directory = Join-Path $env:LOCALAPPDATA 'chris-page\dev-https'
if (Test-Path $directory) {
  throw "The development certificate directory already exists: $directory. Remove or back it up manually before generating a replacement."
}

$addresses = @(Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notlike '169.254.*' -and $_.AddressState -eq 'Preferred' } |
  Select-Object -ExpandProperty IPAddress -Unique)
$san = '2.5.29.17={text}DNS=localhost&IPAddress=127.0.0.1'
foreach ($address in $addresses) {
  $san += "&IPAddress=$address"
}

$ca = $null
$server = $null
try {
  New-Item -ItemType Directory -Path $directory | Out-Null
  $ca = New-SelfSignedCertificate -Type Custom -Subject 'CN=CHRIS Page Development CA' `
    -KeyAlgorithm RSA -KeyLength 2048 -HashAlgorithm SHA256 -KeyExportPolicy NonExportable `
    -KeyUsage CertSign, CRLSign -TextExtension @('2.5.29.19={critical}{text}ca=1&pathlength=0') `
    -CertStoreLocation 'Cert:\CurrentUser\My' -NotAfter (Get-Date).AddYears(2)
  $server = New-SelfSignedCertificate -Type Custom -Subject 'CN=localhost' `
    -KeyAlgorithm RSA -KeyLength 2048 -HashAlgorithm SHA256 -KeyExportPolicy Exportable `
    -KeyUsage DigitalSignature, KeyEncipherment `
    -TextExtension @($san, '2.5.29.37={text}1.3.6.1.5.5.7.3.1') `
    -Signer $ca -CertStoreLocation 'Cert:\CurrentUser\My' -NotAfter (Get-Date).AddYears(1)

  $bytes = New-Object byte[] 32
  $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $random.GetBytes($bytes) } finally { $random.Dispose() }
  $password = [Convert]::ToBase64String($bytes)
  $securePassword = ConvertTo-SecureString $password -AsPlainText -Force
  Export-PfxCertificate -Cert $server -FilePath (Join-Path $directory 'server.pfx') -Password $securePassword | Out-Null
  Export-Certificate -Cert $ca -FilePath (Join-Path $directory 'development-ca.cer') | Out-Null
  [System.IO.File]::WriteAllText((Join-Path $directory 'password.txt'), $password)
  Write-Host "Development certificate created in $directory."
  Write-Host 'The CA certificate must be manually trusted on each test device.'
  Write-Host 'Run npm run dev:https and use the network HTTPS URL printed by Vite.'
} finally {
  if ($server) { Remove-Item -LiteralPath ("Cert:\CurrentUser\My\" + $server.Thumbprint) }
  if ($ca) { Remove-Item -LiteralPath ("Cert:\CurrentUser\My\" + $ca.Thumbprint) }
}
