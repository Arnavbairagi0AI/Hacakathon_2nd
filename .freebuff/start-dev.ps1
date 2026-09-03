$node = 'C:\Program Files\nodejs\node.exe'
$root = 'C:\Users\Arnav Bairagi\Downloads\agon-agent_1-caddf810 (1)'
$log = "$root\.freebuff\preview-048ca85d-f728-43c8-9b2c-a8ee0c1a4901.log"
$err = "$root\.freebuff\preview-048ca85d-f728-43c8-9b2c-a8ee0c1a4901.log.err"
$p = Start-Process -FilePath $node -ArgumentList "`"$root\node_modules\vite\bin\vite.js`"",'--host' -RedirectStandardOutput $log -RedirectStandardError $err -WindowStyle Hidden -PassThru
Write-Output $p.Id