# Todo Summary Assistant

## LLM Integration (OpenAI)

This app uses OpenAI's GPT-3.5-turbo to summarize your to-do list.

### Setup OpenAI API Key

1. Sign up at https://platform.openai.com/ and get an API key (free tier available).
2. In the project root, create a `.env` file (or `.env.local` for Vite):

```
VITE_OPENAI_API_KEY=sk-...your_openai_key...
```

3. Restart the dev server after adding the key.

## Slack Integration

This app can send your to-do summary to a Slack channel using Incoming Webhooks.

### Setup Slack Webhook

1. Go to https://api.slack.com/apps and create a new app (or use an existing one).
2. Add the "Incoming Webhooks" feature.
3. Activate Incoming Webhooks and create a new webhook for your desired channel.
4. Copy the webhook URL.
5. In your `.env` file, add:

```
VITE_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url
```

6. Restart the dev server after adding the key.

## Usage

- The summary button will use OpenAI to generate a summary and post it to your Slack channel.
- If you see errors, check your API key and webhook URL in the `.env` file.

---

**Never commit your API keys or webhook URLs to public repositories!**
