
# Intro

Explainit. Create sharable chats with your documentation. Let developers get quickly what they want from you by creating powerful llm agents with your data. Upload some sources and get it up in minutes.

- Run dev with `docker-compose up --build`

# TODO

deployment

development-product


development-improvements

TODO: - implement events for stuff like, plan cancelled and so on, so far just email to manually do it
TODO: - chat-controller test
TODO: - Deployment, get it toghether, supabase db, storage and auth? railway for deployments? 
    - Ideally all aws ses, s3, hosting, plus railway for server and db


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

# Indie hackers / reddit

## I build a ai chatbot generator for documentation sites in seconds

If you have a developer documentation and want to boost your community with ai this is for you! Just pull in the base url of the site add some customization and get a sharable link for your chat, link it anywhere you want.

I saw this trend in some places like gcp with gemini, or langchain or supabase ask ai, but they're all custom implemented solutions, not everyone wants to advocate developer resources to create the rag, deploy it and maintain it, you just want devs to build with your stuff, the more they can do the better, the quicker the better, and if they get a smooth experience while doing it that's legendary already.

Just some clicks!! With one base url you are half way through. Check it out at https://explainit.mzslabs.com

Any feedback is welcomed! Thanks!

## Chat bubble snippet

```html
<html>
    <head>
        <style>
            /* Style for the chat bubble */
            .chat-bubble {
                z-index: 1000;
                position: fixed;
                bottom: 20px;
                right: 20px;
                background-color: #007bff;
                color: #ffffff;
                padding: 10px 20px;
                border-radius: 20px 20px 0px 20px;
                cursor: pointer;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                transition: all 0.3s ease;
            }

            /* Style for the chat bubble when hovered */
            .chat-bubble:hover {
                background-color: #0056b3;
            }
        </style>
    </head>
    <body>
        <a className="chat-bubble" href="https://explainit.mzslabs.com/chat/{your-id}">Ask AI</a>
        <!-- ... -->
    </body>
</html>
```
