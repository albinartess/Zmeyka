--- publish.bat (原始)


+++ publish.bat (修改后)
@echo off
chcp 65001 >nul
rem Публикация проекта в https://github.com/albinartess/Zmeyka
cd /d "%~dp0"

where git >nul 2>&1 || (echo Git не найден. Установите: https://git-scm.com/downloads & pause & exit /b 1)

if not exist .git (
  git init -b main 2>nul || (git init & git branch -M main)
)

git add .
git rev-parse --verify HEAD >nul 2>&1 && (git status --porcelain | findstr /r . >nul || goto :push)
git commit -m "Змейка: браузерная аркада на React + Canvas"

:push
git remote remove origin 2>nul
git remote add origin https://github.com/albinartess/Zmeyka.git
git push -u origin main
if errorlevel 1 (
  echo.
  echo Push отклонён — вероятно, в репозитории уже есть коммиты.
  echo Выполните: git pull origin main --allow-unrelated-histories
  pause
  exit /b 1
)

echo.
echo Готово! Код опубликован: https://github.com/albinartess/Zmeyka
echo Включите Pages: https://github.com/albinartess/Zmeyka/settings/pages (Source: GitHub Actions)
echo Игра появится на https://albinartess.github.io/Zmeyka/
pause
