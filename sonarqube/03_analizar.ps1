Write-Host "========================================="
Write-Host "Iniciando auditoria de codigo estatico..."
Write-Host "Proyecto: Heladeria Backend"
Write-Host "========================================="

# Comando principal que ejecuta el escáner de SonarQube
sonar-scanner

Write-Host "========================================="
Write-Host "Analisis terminado. Revisa tu panel en localhost:9000"
Write-Host "========================================="
Pause