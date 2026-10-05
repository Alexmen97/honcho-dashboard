FROM node:20-alpine
WORKDIR /app

# Copy production bundle and server gateway
COPY dist ./dist
COPY server ./server
COPY package.json ./

ENV PORT=3000
ENV HOST=0.0.0.0
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "server/index.mjs"]
