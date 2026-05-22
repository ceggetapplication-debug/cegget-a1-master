$path = 'c:\Users\rosah\Desktop\cegget-a1-master\app\(main)\main screens\profile.tsx'
$bytes = [System.IO.File]::ReadAllBytes($path)
Write-Host "Total bytes: $($bytes.Length)"

for ($i=0; $i -lt $bytes.Length; $i++) {
    if ($bytes[$i] -ne 0 -and $bytes[$i] -ne 32 -and $bytes[$i] -ne 9 -and $bytes[$i] -ne 10 -and $bytes[$i] -ne 13) {
        Write-Host "Found significant byte $($bytes[$i]) at index $i"
        $start = [Math]::Max(0, $i - 10)
        $len = [Math]::Min(500, $bytes.Length - $start)
        $subBytes = $bytes[$start..($start + $len - 1)]
        $text = [System.Text.Encoding]::Utf8.GetString($subBytes)
        Write-Host "Preview (UTF8): $text"
        $textUni = [System.Text.Encoding]::Unicode.GetString($subBytes)
        Write-Host "Preview (Unicode): $textUni"
        break
    }
}



