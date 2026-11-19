# Image de production du site HOPE Services (Next.js « standalone »).
# Cibles :
#   runner  (défaut) : le site
#   migrate          : applique les migrations Prisma puis s'arrête
# Le build n'a pas besoin de la base de données : les pages lisent leurs données à la requête.

FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# postinstall lance « prisma generate » : le schéma doit être présent.
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

FROM deps AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

FROM deps AS migrate
CMD ["npx", "prisma", "migrate", "deploy"]

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    UPLOAD_DIR=/data/uploads
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
RUN mkdir -p /data/uploads && chown -R node:node /data
USER node
EXPOSE 3000
CMD ["node", "server.js"]
