kill-8080-5173:
	@echo "Killing ports 8080 and 5173 if running..."
	@lsof -n -i :8080 | awk 'NR==2 {print $2}' | xargs kill

run-local:
	make kill-8080-5173
	cd backend && make init && make build-local
	cd backend && ./bin/main &
	@echo "Waiting for go build to complete..."
	@until curl -s http://localhost:8080/health > /dev/null; do sleep 1; done
	cd frontend && npm ci && npm run dev

