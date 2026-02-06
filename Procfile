# Procfile pour Railway - Build et démarrage
release: cd server && npm ci --include=dev && npm run build
web: npm run server:start

"startCommand": "PORT=8081 node server/dist/index.js"
