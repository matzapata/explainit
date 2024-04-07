
# Intro

Explainit. Create sharable chats with your documentation. Let developers get quickly what they want from you by creating powerful llm agents with your data. Upload some sources and get it up in minutes.

- Run dev with `docker-compose up --build`

# TODO

development-product

TODO: - Add a demo, example with smart wallets or any other website
TODO: - Custom plan prompt in landing.

development-improvements

TODO: - chat-controller test

deployment

TODO: - Deployment, get it toghether, supabase db, storage and auth? railway for deployments? Ideally all aws or gcp
    - railway, cheap, no storage, no vectordb 
TODO: - add metadata to token ({ switch auth provider? })
TODO: - test all flows

# Deployment

Setup env variables
- resend
- gcp storage
- openai
- postgress db with vercel
- domain


0. Create empty services in railway and pgvector db
1. `cd client && railway link && railway up`
2. `cd server && railway link && railway up`



# Usage

1. Create postgres db
2. Update prisma schema and run first migration
3. Get resend and gcp storage credentials
4. Update payments plans
5. Configure kinde, add email to token with hasura mapping
6. Remove unused modules
