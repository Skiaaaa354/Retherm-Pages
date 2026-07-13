@echo off
rem Lokale Vorschau der RETHERM-Website: Doppelklick genuegt.
rem Browser oeffnet sich, das schwarze Fenster muss offen bleiben
rem (zum Beenden einfach schliessen).
start "" "http://localhost:8123/index.html"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0.claude\serve.ps1"
