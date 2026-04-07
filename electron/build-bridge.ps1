$csc = Get-ChildItem -Path "C:\Windows\Microsoft.NET\Framework64\v4.0.*" -Filter "csc.exe" -Recurse | Select-Object -First 1 -ExpandProperty FullName

if (-not $csc) {
    Write-Error "Could not find csc.exe. Please ensure .NET Framework 4.5+ is installed."
    exit 1
}

Write-Host "Found compiler at: $csc"

$wpfDir = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\WPF"

& $csc /out:electron\UiaBridge.exe /lib:$wpfDir /reference:UIAutomationClient.dll,UIAutomationTypes.dll,System.Runtime.Serialization.dll electron\UiaBridge.cs

if ($LASTEXITCODE -eq 0) {
    Write-Host "Successfully built UiaBridge.exe"
} else {
    Write-Error "Failed to build UiaBridge.exe"
}
