Install-Module -Name PSWindowsUpdate -Force -AllowClobber
Import-Module PSWindowsUpdate 
Get-WUInstall -MicrosoftUpdate -AcceptAll -AutoReboot

# updateScript.ps1
