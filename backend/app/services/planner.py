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


def generate_plan(db: Session, user_id: int, sleep_start: int = 23, sleep_end: int = 8, max_sessions_per_day: int = 3):
    start_date = datetime.now()
    end_date = start_date + timedelta(days=7) # 7 napra nézünk előre

    slots = get_free_slots(db, user_id, start_date, end_date)

    tasks = db.query(models.Task).join(models.Class).filter(
        models.Task.user_id == user_id,
        models.Task.is_completed == False
    ).all()

    tasks.sort(key=calculate_priority, reverse=True)

    recommendations = []
    current_slot_idx = 0
    daily_session_counts = {}

    for task in tasks:
        task_scheduled = False

        while current_slot_idx < len(slots) and not task_scheduled:
            slot = slots[current_slot_idx]
            study_start = slot["start"]
            study_end_estimate = study_start + timedelta(minutes=60)

            day_key = study_start.date().isoformat()
            if day_key not in daily_session_counts:
                daily_session_counts[day_key] = 0

            if daily_session_counts[day_key] >= max_sessions_per_day:
                next_morning = study_start.replace(hour=sleep_end, minute=0, second=0, microsecond=0) + timedelta(days=1)
                time_skipped = (next_morning - study_start).total_seconds() / 60
                slot["start"] = next_morning
                slot["duration_minutes"] -= time_skipped
                continue

            if study_end_estimate.hour >= sleep_start or study_start.hour < sleep_end:
                if study_start.hour >= sleep_start:
                    next_morning = study_start.replace(hour=sleep_end, minute=0, second=0, microsecond=0) + timedelta(days=1)
                else:
                    next_morning = study_start.replace(hour=sleep_end, minute=0, second=0, microsecond=0)

                time_skipped = (next_morning - study_start).total_seconds() / 60
                slot["start"] = next_morning
                slot["duration_minutes"] -= time_skipped
                continue

            if slot["duration_minutes"] >= 60:
                study_end = slot["start"] + timedelta(minutes=60)

                rec_start = slot["start"].isoformat() if hasattr(slot["start"], "isoformat") else slot["start"]
                rec_end = study_end.isoformat() if hasattr(study_end, "isoformat") else study_end

                recommendations.append({
                    "task_id": task.id,
                    "task_title": task.title,
                    "class_name": task.related_class.name,
                    "start": rec_start,
                    "end": rec_end,
                    "message": f"Recommended to study '{task.title}' during this slot."
                })

                daily_session_counts[day_key] += 1

                slot["start"] = study_end + timedelta(minutes=10)
                slot["duration_minutes"] -= 70
                task_scheduled = True
            else:
                current_slot_idx += 1

    return recommendations

def save_planned_sessions(db: Session, user_id: int, recommendations: list):
    # delete old unaccepted sessions before saving new ones
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
