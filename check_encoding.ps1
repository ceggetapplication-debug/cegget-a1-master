$path = 'c:\Users\rosah\Desktop\cegget-a1-master\app\(main)\main screens\temp.txt'
$content = Get-Content -Path $path -Raw -Encoding Unicode
if ($null -eq $content) {
    Write-Host "Content is null"
} else {
    Write-Host "Total length: $($content.Length)"
    for ($i=0; $i -lt $content.Length; $i++) {
        if ($content[$i] -ne ' ' -and $content[$i] -ne "`0" -and $content[$i] -ne "`t" -and $content[$i] -ne "`r" -and $content[$i] -ne "`n") {
            Write-Host "Found significant character at index $i"
            Write-Host "Char: $($content[$i])"
            $preview = $content.Substring($i, [Math]::Min(1000, $content.Length - $i))
            Write-Host "Preview: $preview"
            break
        }
    }
}

