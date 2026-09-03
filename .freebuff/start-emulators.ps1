$node = 'C:\Program Files\nodejs\node.exe'
$root = 'C:\Users\Arnav Bairagi\Downloads\agon-agent_1-caddf810 (1)'
$log = "$root\.freebuff\emulators.log"
$err = "$root\.freebuff\emulators.log.err"
$p = Start-Process -FilePath $node -ArgumentList "`"$root\node_modules\firebase-tools\lib\bin\firebase.js`"",'emulators:start','--only','auth,firestore,storage','--project','demo-venturesetu' -RedirectStandardOutput $log -RedirectStandardError $err -WindowStyle Hidden -PassThru
Write-Output $p.Id