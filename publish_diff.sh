--- publish.sh (原始)


+++ publish.sh (修改后)
#!/usr/bin/env bash
# Публикация проекта в https://github.com/albinartess/Zmeyka
# Запуск: ./publish.sh  (или: bash publish.sh)
set -e
cd "$(dirname "$0")"

command -v git >/dev/null 2>&1 || { echo "Git не найден. Установите: https://git-scm.com/downloads"; exit 1; }

if [ ! -d .git ]; then
  git init -b main 2>/dev/null || { git init && git branch -M main; }
fi

git add .
if ! git rev-parse --verify HEAD >/dev/null 2>&1 || [ -n "$(git status --porcelain)" ]; then
  git commit -m "Змейка: браузерная аркада на React + Canvas"
fi

git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/albinartess/Zmeyka.git

if git push -u origin main; then
  echo ""
  echo "Готово! Код опубликован: https://github.com/albinartess/Zmeyka"
  echo "Включите Pages: https://github.com/albinartess/Zmeyka/settings/pages (Source: GitHub Actions)"
  echo "Игра появится на https://albinartess.github.io/Zmeyka/"
else
  echo ""
  echo "Push отклонён — вероятно, в репозитории уже есть коммиты (например, README)."
  echo "Выполните, затем повторите скрипт:"
  echo "  git pull origin main --allow-unrelated-histories"
  exit 1
fi
