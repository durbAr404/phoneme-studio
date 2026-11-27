.PHONY: setup dev-api dev-web test lint e2e
setup:
	cd apps/api && python -m venv .venv && .venv/bin/pip install -r requirements.txt -r requirements-dev.txt && cp -n .env.example .env || true
	cd apps/web && npm install && cp -n .env.example .env.local || true
db:
	cd apps/api && .venv/bin/alembic upgrade head && .venv/bin/python -m app.seed
dev-api:
	cd apps/api && .venv/bin/uvicorn app.main:app --reload --port 8000
dev-web:
	cd apps/web && npm run dev
test:
	cd apps/api && .venv/bin/pytest -q
	cd apps/web && npm test
lint:
	cd apps/api && .venv/bin/ruff check app tests
	cd apps/web && npm run lint && npm run typecheck
e2e:
	cd apps/web && npx playwright test
