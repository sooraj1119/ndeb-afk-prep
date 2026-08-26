$task = Get-ScheduledTask -TaskName 'FIFA_Shorts_Bot'
$settings = $task.Settings
$settings.StartWhenAvailable = $true
Set-ScheduledTask -TaskName 'FIFA_Shorts_Bot' -Settings $settings
