import json
from pywebpush import webpush, WebPushException
from datetime import datetime, timedelta
import time

VAPID_PRIVATE_KEY = "your_vapid_private_key"
VAPID_CLAIMS = {"sub": "mailto:your-email@example.com"}

def send_push_notification(subscription_json: str, title: str, body: str):
  if not subscription_json:
    return
  
  try:
    subscription_info = json.loads(subscription_json)

    payload = json.dumps({
      "title": title,
      "body": body,
      "icon": "/logo.png"
    })

    webpush(
      subscription_info=subscription_info,
      data=payload,
      vapid_private_key=VAPID_PRIVATE_KEY,
      vapid_claims=VAPID_CLAIMS
    )
    print("Push notification sent successfully.")
  except WebPushException as ex:
    print(f"Web push failed: {repr(ex)}")

def schedule_push(subscription_json: str, start_time: datetime, task_title: str):
    trigger_time = start_date = start_time - timedelta(minutes=10)
    seconds_to_wait = (trigger_time - datetime.now()).total_seconds()

    if seconds_to_wait > 0:
        time.sleep(seconds_to_wait)

    send_push_notification(
        subscription_json=subscription_json,
        title="Upcoming Study Session",
        body=f"You have a study session for '{task_title}' starting in 10 minutes."
    )
