# Buzz Backend — geliştirme kısayolları (ADIM 9)
# Windows'ta: make için "choco install make" veya Git Bash kullanın.

.PHONY: dev dev-infra stop build test e2e lint prisma clean logs

## Tam stack'i docker ile ayağa kaldır (Postgres + Redis + MinIO + backend + worker'lar)
dev:
	docker compose up -d --build
	@echo "Backend: http://localhost:3000  |  MinIO konsol: http://localhost:9001"

## Sadece altyapı (Postgres + Redis + MinIO) — backend'i lokalde çalıştırmak için
dev-infra:
	docker compose up -d postgres redis minio minio-init

## Tüm container'ları durdur
stop:
	docker compose down

## Backend'i derle
build:
	npm run build

## Birim testleri (jest)
test:
	npm test

## Uçtan uca testler (playwright) — önce build gerekli
e2e:
	npm run build
	npm run test:e2e:pw

## Lint
lint:
	npx eslint src --max-warnings 9999

## Prisma client üret + şemayı DB'ye uygula
prisma:
	npx prisma generate
	npx prisma db push

## Derleme çıktıları + test raporlarını temizle
clean:
	-rmdir /s /q dist 2>NUL || rm -rf dist
	-rmdir /s /q test-results 2>NUL || rm -rf test-results

## Docker loglarını izle
logs:
	docker compose logs -f --tail=50
