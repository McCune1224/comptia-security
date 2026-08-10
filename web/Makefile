SERVICE ?= quizapp
DEPLOY_USER ?= dietpi
HOME_DIR ?= /home/$(DEPLOY_USER)
REPO_DIR ?= $(HOME_DIR)/comptia-security
WEB_DIR ?= $(REPO_DIR)/web
NODE ?= /usr/local/bin/node
DB ?= $(WEB_DIR)/data/quiz.db
BACKUP_DIR ?= $(WEB_DIR)/data/backups

.PHONY: pull install check test verify build restart deploy status logs start stop reset-runtime

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

status:
	sudo systemctl status $(SERVICE) --no-pager -l

logs:
	sudo journalctl -xu $(SERVICE) --no-pager -n 50

start:
	sudo systemctl start $(SERVICE)

stop:
	sudo systemctl stop $(SERVICE)

reset-runtime:
	@test "$(CONFIRM)" = "YES" || (echo 'Refusing reset: rerun with CONFIRM=YES'; exit 2)
	@test -f "$(DB)" || (echo "Database not found: $(DB)"; exit 2)
	@set -eu; \
		stamp=$$(date +%Y%m%d-%H%M%S); \
		backup="$(BACKUP_DIR)/quiz.db.before-clean-slate-$$stamp"; \
		mkdir -p "$(BACKUP_DIR)"; \
		sudo systemctl stop "$(SERVICE)"; \
		trap 'sudo systemctl start "$(SERVICE)"' EXIT; \
		cp --preserve=mode,timestamps "$(DB)" "$$backup"; \
		[ ! -f "$(DB)-wal" ] || cp --preserve=mode,timestamps "$(DB)-wal" "$$backup-wal"; \
		[ ! -f "$(DB)-shm" ] || cp --preserve=mode,timestamps "$(DB)-shm" "$$backup-shm"; \
		cd "$(WEB_DIR)"; \
		"$(NODE)" scripts/reset-runtime.mjs --db "$(DB)" --yes; \
		echo "Backup: $$backup"; \
		echo "Service will start automatically."
