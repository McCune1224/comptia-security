SERVICE ?= quizapp
DEPLOY_USER ?= dietpi
HOME_DIR ?= /home/$(DEPLOY_USER)
REPO_DIR ?= $(HOME_DIR)/comptia-security
WEB_DIR ?= $(REPO_DIR)/web
NODE ?= /usr/local/bin/node
BACKUP_DIR ?= $(WEB_DIR)/data/backups

.PHONY: pull install check test verify build restart deploy update status logs start stop reset-runtime

pull:
	git -C $(REPO_DIR) pull --ff-only

install:
	cd $(WEB_DIR) && npm ci

check:
	cd $(WEB_DIR) && npm run check

test:
	cd $(WEB_DIR) && npm test

verify:
	cd $(WEB_DIR) && npm run verify

build:
	cd $(WEB_DIR) && npm run build

restart:
	sudo systemctl daemon-reload
	sudo systemctl restart $(SERVICE)

deploy: pull install verify build restart

# Quick ship: pull, rebuild, restart, show status — the day-to-day update path.
update: pull build restart status

status:
	sudo systemctl status $(SERVICE) --no-pager -l

logs:
	sudo journalctl -xu $(SERVICE) --no-pager -n 50

start:
	sudo systemctl start $(SERVICE)

stop:
	sudo systemctl stop $(SERVICE)

# Wipes per-user runtime rows from the PostgreSQL database named by
# DATABASE_URL (the runtime DB), preserving profiles and course content.
# Dumps a pg_dump backup first when pg_dump is installed.
reset-runtime:
	@test "$(CONFIRM)" = "YES" || (echo 'Refusing reset: rerun with CONFIRM=YES'; exit 2)
	@set -eu; \
		db_url=$${DATABASE_URL:?DATABASE_URL is not set — export it (see web/.env.example) before resetting}; \
		stamp=$$(date +%Y%m%d-%H%M%S); \
		mkdir -p "$(BACKUP_DIR)"; \
		backup="$(BACKUP_DIR)/runtime-before-reset-$$stamp.sql"; \
		if command -v pg_dump >/dev/null 2>&1; then \
			echo "Backing up to $$backup"; \
			pg_dump "$$db_url" > "$$backup"; \
		else \
			echo "pg_dump not found — continuing without a backup."; \
		fi; \
		sudo systemctl stop "$(SERVICE)"; \
		trap 'sudo systemctl start "$(SERVICE)"' EXIT; \
		cd "$(WEB_DIR)"; \
		"$(NODE)" scripts/reset-runtime.mjs --database-url "$$db_url" --yes; \
		echo "Service will start automatically."
