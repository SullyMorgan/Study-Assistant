from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import models

def get_free_slots(db: Session, user_id: int, start_date: datetime, end_date: datetime):
  busy_events = db.query(models.UserSchedule).filter(
    models.UserSchedule.user_id == user_id,
    models.UserSchedule.start_time >= start_date,
    models.UserSchedule.end_time <= end_date
  ).order_by(models.UserSchedule.start_time).all()

  free_slots = []
  current_time = start_date

  for event in busy_events:
    if event.start_time > current_time:
      free_slots.append({
        "start": current_time,
        "end": event.start_time,
        "duration_minutes": (event.start_time - current_time).total_seconds() / 60
      })
    current_time = max(current_time, event.end_time)

  if current_time < end_date:
    free_slots.append({
      "start": current_time,
      "end": end_date,
      "duration_minutes": (end_date - current_time).total_seconds() / 60
    })

  return free_slots

def calculate_priority(task):
  score = int(task.related_class.difficulty)

  if task.type == models.TaskType.exam:
    score += 5

  days_until = (task.deadline - datetime.now()).days
  if days_until < 0:
    days_until = 0

  urgency_bonus = 20 / (days_until + 1)

  return score + urgency_bonus


def generate_plan(db: Session, user_id: int):
  start_date = datetime.now()
  end_date = start_date + timedelta(days=3)

  slots = get_free_slots(db, user_id, start_date, end_date)

  tasks = db.query(models.Task).join(models.Class).filter(
    models.Task.user_id == user_id,
    models.Task.is_completed == False
  ).all()

  tasks.sort(key=calculate_priority, reverse=True)

  recommendations = []

  for slot in slots:
    for task in tasks:
      if slot["duration_minutes"] >= 45:
        study_start = slot["start"]
        study_end = study_start + timedelta(minutes=45)

        recommendations.append({
          "task_id": task.id,
          "task_title": task.title,
          "class_name": task.related_class.name,
          "start": study_start,
          "end": study_end,
          "message": f"Recommended to study '{task.title}' from '{task.related_class.name}' during this slot."
        })

        slot["start"] = study_end + timedelta(minutes=15)
        slot["duration_minutes"] -= 60
      else:
        break


  return recommendations

def save_planned_sessions(db: Session, user_id: int, recommendations: list):
  db.query(models.PlannedSession).filter(
    models.PlannedSession.user_id == user_id,
    models.PlannedSession.is_accepted == False
  ).delete()

  for rec in recommendations:
    new_session = models.PlannedSession(
      user_id=user_id,
      task_id=rec['task_id'],
      start_time=rec['start'],
      end_time=rec['end'],
      is_accepted=False
    )
    db.add(new_session)

  db.commit()
