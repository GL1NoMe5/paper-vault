Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)

portableExe = currentDir & "\dist-electron\Уютный Бюджет 1.0.0.exe"
unpackedExe = currentDir & "\dist-electron\win-unpacked\Уютный Бюджет.exe"

If fso.FileExists(portableExe) Then
    WshShell.Run """" & portableExe & """", 1, False
ElseIf fso.FileExists(unpackedExe) Then
    WshShell.Run """" & unpackedExe & """", 1, False
Else
    WshShell.CurrentDirectory = currentDir
    WshShell.Run "cmd /c chcp 65001 && npx.cmd electron .", 0, False
End If
