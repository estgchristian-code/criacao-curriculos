$ErrorActionPreference = 'Stop'

function Stop-WithError {
    param([Parameter(Mandatory = $true)][string]$Message)

    Write-Host "ERRO: $Message" -ForegroundColor Red
    exit 1
}

function ConvertTo-PowerShellLiteral {
    param([Parameter(Mandatory = $true)][string]$Value)

    return "'" + $Value.Replace("'", "''") + "'"
}

function Test-PortInUse {
    param([Parameter(Mandatory = $true)][int]$Port)

    foreach ($address in @(
        [System.Net.IPAddress]::Loopback,
        [System.Net.IPAddress]::IPv6Loopback
    )) {
        $client = [System.Net.Sockets.TcpClient]::new($address.AddressFamily)
        try {
            $client.Connect($address, $Port)
            return $true
        } catch [System.Net.Sockets.SocketException] {
            if ($_.Exception.SocketErrorCode -notin @(
                [System.Net.Sockets.SocketError]::ConnectionRefused,
                [System.Net.Sockets.SocketError]::AddressFamilyNotSupported,
                [System.Net.Sockets.SocketError]::AddressNotAvailable,
                [System.Net.Sockets.SocketError]::NetworkUnreachable
            )) {
                Stop-WithError "Nao foi possivel verificar a porta $Port. $_"
            }
        } finally {
            $client.Dispose()
        }
    }

    return $false
}

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$frontendPath = Join-Path $projectRoot 'frontend'
$backendPath = Join-Path $projectRoot 'backend'

foreach ($directory in @(
    @{ Path = $frontendPath; Name = 'frontend' },
    @{ Path = $backendPath; Name = 'backend' }
)) {
    if (-not (Test-Path $directory.Path -PathType Container)) {
        Stop-WithError "Diretorio '$($directory.Name)' nao encontrado em '$($directory.Path)'."
    }
}

$frontendPackagePath = Join-Path $frontendPath 'package.json'
$frontendDependenciesPath = Join-Path $frontendPath 'node_modules\.bin\vite.cmd'
$backendEntryPoint = Join-Path $backendPath 'artisan'
$backendDependenciesPath = Join-Path $backendPath 'vendor\autoload.php'

if (-not (Test-Path $frontendPackagePath -PathType Leaf)) {
    Stop-WithError "Manifesto do frontend nao encontrado: '$frontendPackagePath'."
}

try {
    $frontendPackage = Get-Content $frontendPackagePath -Raw | ConvertFrom-Json
} catch {
    Stop-WithError "Nao foi possivel ler o manifesto do frontend: $_"
}

if (-not $frontendPackage.scripts.dev) {
    Stop-WithError "O script 'dev' nao esta configurado em '$frontendPackagePath'."
}

if (-not (Test-Path $frontendDependenciesPath -PathType Leaf)) {
    Stop-WithError "Dependencias do frontend nao encontradas. Execute 'npm install' em '$frontendPath'."
}

if (-not (Test-Path $backendEntryPoint -PathType Leaf)) {
    Stop-WithError "Ponto de entrada do Laravel nao encontrado: '$backendEntryPoint'."
}

if (-not (Test-Path $backendDependenciesPath -PathType Leaf)) {
    Stop-WithError "Dependencias do Laravel nao encontradas. Execute 'composer install' em '$backendPath'."
}

$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npmCommand) {
    Stop-WithError "npm nao encontrado no PATH. Instale o Node.js e abra um novo terminal."
}

$phpCommand = Get-Command php.exe -ErrorAction SilentlyContinue
if (-not $phpCommand) {
    Stop-WithError "PHP nao encontrado no PATH. Instale o PHP e abra um novo terminal."
}

$powershellCommand = Get-Command powershell.exe -ErrorAction SilentlyContinue
if (-not $powershellCommand) {
    Stop-WithError "powershell.exe nao foi encontrado."
}

$ports = @(
    @{ Number = 5173; Name = 'Frontend' },
    @{ Number = 8000; Name = 'Backend' }
)

foreach ($port in $ports) {
    if (Test-PortInUse -Port $port.Number) {
        Stop-WithError "Porta $($port.Number) ($($port.Name)) ja esta ocupada. Feche esse servidor antes de executar 'npm run dev'."
    }
}

$npmPath = ConvertTo-PowerShellLiteral -Value $npmCommand.Source
$phpPath = ConvertTo-PowerShellLiteral -Value $phpCommand.Source
$frontendWorkingDirectory = ConvertTo-PowerShellLiteral -Value $frontendPath
$backendWorkingDirectory = ConvertTo-PowerShellLiteral -Value $backendPath

$frontendCommand = "& { `$Host.UI.RawUI.WindowTitle = 'ResumeBuilder - Frontend'; Set-Location $frontendWorkingDirectory; & $npmPath run dev -- --host localhost --port 5173 --strictPort }"
$backendCommand = "& { `$Host.UI.RawUI.WindowTitle = 'ResumeBuilder - Backend'; Set-Location $backendWorkingDirectory; & $phpPath artisan serve --host=127.0.0.1 --port=8000 }"

Write-Host ''
Write-Host 'Iniciando o ResumeBuilder em terminais separados:' -ForegroundColor Cyan
Write-Host '  Frontend: http://localhost:5173'
Write-Host '  Backend:  http://127.0.0.1:8000'
Write-Host ''

try {
    $frontendTerminal = Start-Process `
        -FilePath $powershellCommand.Source `
        -ArgumentList @('-NoExit', '-Command', $frontendCommand) `
        -WorkingDirectory $frontendPath `
        -PassThru
} catch {
    Stop-WithError "Nao foi possivel abrir o terminal do frontend: $_"
}

try {
    $backendTerminal = Start-Process `
        -FilePath $powershellCommand.Source `
        -ArgumentList @('-NoExit', '-Command', $backendCommand) `
        -WorkingDirectory $backendPath `
        -PassThru
} catch {
    Write-Error "Nao foi possivel abrir o terminal do backend: $_"
    Write-Error "O terminal do frontend (PID $($frontendTerminal.Id)) ja foi aberto. Feche-o manualmente."
    exit 1
}

Write-Host "Frontend iniciado em terminal separado (PID $($frontendTerminal.Id))." -ForegroundColor Green
Write-Host "Backend iniciado em terminal separado (PID $($backendTerminal.Id))." -ForegroundColor Green
