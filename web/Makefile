SERVICE = quizapp
USER = dietpi
HOME_DIR = /home/$(USER)
REPO_DIR = $(HOME_DIR)/comptia-security
WEB_DIR = $(REPO_DIR)/web
NODE = /usr/local/bin/node

.PHONY: pull build restart deploy status logs install

pull:
	git -C $(REPO_DIR) pull

install:
	cd $(WEB_DIR) && npm install

build:
	cd $(WEB_DIR) && npm run build

restart:
	sudo systemctl daemon-reload
	sudo systemctl restart $(SERVICE)

deploy: pull install build restart

status:
	sudo systemctl status $(SERVICE) --no-pager -l

logs:
	sudo journalctl -xu $(SERVICE) --no-pager -n 50

start:
	sudo systemctl start $(SERVICE)

stop:
	sudo systemctl stop $(SERVICE)
