# Deploy to Google Cloud Run

## Prerequisites
- Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
- A Google Cloud project with billing enabled

## Setup (one-time)

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

## Deploy

From the project root, run:

```bash
gcloud run deploy visa-bulletin-tracker \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000
```

This single command will:
1. Build the Docker image using Cloud Build
2. Push it to Artifact Registry
3. Deploy it to Cloud Run
4. Make it publicly accessible

After deployment, `gcloud` will print a URL like:
```
https://visa-bulletin-tracker-xxxxx-uc.a.run.app
```

That's your live site.

## Verify

1. Visit the URL in a browser — the frontend should load
2. Hit `<URL>/api/visa-bulletin` — should return JSON with bulletin data
3. Check logs: `gcloud run logs read --service visa-bulletin-tracker --region us-central1`
