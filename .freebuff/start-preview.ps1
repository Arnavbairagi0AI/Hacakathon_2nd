$node = 'C:\Program Files\nodejs\node.exe'
$root = 'C:\Users\Arnav Bairagi\Downloads\agon-agent_1-caddf810 (1)'
$log = "$root\.freebuff\preview-4173.log"
$err = "$root\.freebuff\preview-4173.log.err"
$p = Start-Process -FilePath $node -ArgumentList "`"$root\node_modules\vite\bin\vite.js`"",'preview','--port','4173','--strictPort' -RedirectStandardOutput $log -RedirectStandardError $err -WindowStyle Hidden -PassThru
Write-Output $p.Id
