"""
StudyMate AI — FastAPI Backend Server
Provides full RESTful API for tasks, study plans, interactive quizzes,
academic progress tracking, and conversational Alexa+-style agent operations.
"""

import os
import json
import uuid
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from database import init_db, get_connection
from seed_data import seed_sample_data
from ai_agent import StudyMateAgent
from quiz_bank import QUESTION_BANK, get_questions_for_subject

# Initialize DB and seed if empty
init_db()
seed_sample_data(force=False)

app = FastAPI(
    title="StudyMate AI API",
    description="Simulated Alexa+ Student Assistant Backend for Amazon Developer Hackathon",
    version="1.0.0"
)

# Enable CORS for local Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = StudyMateAgent()

# ----------------- PYDANTIC SCHEMAS -----------------

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    subject: str
    due_date: str
    due_time: Optional[str] = "18:00"
    priority: Optional[str] = "Medium"
    status: Optional[str] = "Not started"
    resource_url: Optional[str] = None
    notes: Optional[str] = ""

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[str] = None
    due_date: Optional[str] = None
    due_time: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    completed: Optional[bool] = None
    resource_url: Optional[str] = None
    completed_at: Optional[str] = None
    completion_type: Optional[str] = None
    completion_evidence: Optional[str] = None
    notes: Optional[str] = None

class PlanTaskToggle(BaseModel):
    day_number: int
    task_id: str
    completed: bool

class PlanCreate(BaseModel):
    title: str
    subject: str
    duration_days: int
    daily_hours: float
    topics: List[str]

class QuizSubmit(BaseModel):
    subject: str
    topic: str
    score: int
    total_questions: int

# ----------------- HEALTH & SYSTEM -----------------

@app.get("/api/health")
def health_check():
    agent_status = agent.get_status()
    return {
        "status": "healthy",
        "service": "StudyMate AI Backend",
        "timestamp": datetime.now().isoformat(),
        "agent": agent_status
    }

@app.post("/api/reset")
def reset_database():
    res = seed_sample_data(force=True)
    return res

# ----------------- AI CHAT & ACTIONS -----------------

@app.post("/api/chat")
def chat_with_agent(payload: ChatRequest):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    result = agent.process_message(payload.message)
    return result

# ----------------- TASKS MANAGEMENT -----------------

@app.get("/api/tasks")
def list_tasks(filter: str = Query("all", pattern="^(all|today|upcoming|completed|not_started|in_progress)$")):
    conn = get_connection()
    cursor = conn.cursor()
    today = date.today().isoformat()

    if filter == "today":
        cursor.execute("SELECT * FROM tasks WHERE due_date = ? ORDER BY due_time ASC", (today,))
    elif filter == "upcoming":
        cursor.execute("SELECT * FROM tasks WHERE due_date > ? AND completed = 0 ORDER BY due_date ASC, due_time ASC", (today,))
    elif filter == "completed":
        cursor.execute("SELECT * FROM tasks WHERE completed = 1 OR status = 'Completed' ORDER BY due_date DESC", ())
    elif filter == "not_started":
        cursor.execute("SELECT * FROM tasks WHERE status = 'Not started' AND completed = 0 ORDER BY due_date ASC, due_time ASC", ())
    elif filter == "in_progress":
        cursor.execute("SELECT * FROM tasks WHERE status = 'In progress' AND completed = 0 ORDER BY due_date ASC, due_time ASC", ())
    else:
        cursor.execute("SELECT * FROM tasks ORDER BY completed ASC, due_date ASC, due_time ASC")

    rows = cursor.fetchall()
    conn.close()

    tasks = []
    for r in rows:
        tasks.append({
            "id": r["id"],
            "title": r["title"],
            "description": r["description"] or r["notes"] or "",
            "subject": r["subject"],
            "dueDate": r["due_date"],
            "dueTime": r["due_time"] or "18:00",
            "priority": r["priority"],
            "status": r["status"] or ("Completed" if r["completed"] else "Not started"),
            "completed": bool(r["completed"]),
            "resourceUrl": r["resource_url"] or None,
            "completedAt": r["completed_at"] or None,
            "completionType": r["completion_type"] or None,
            "completionEvidence": r["completion_evidence"] or None,
            "notes": r["notes"] or "",
            "createdAt": r["created_at"]
        })
    return tasks

@app.post("/api/tasks")
def create_task(task: TaskCreate):
    conn = get_connection()
    cursor = conn.cursor()
    task_id = f"task-{uuid.uuid4().hex[:8]}"
    created_at = datetime.now().isoformat()
    status = task.status or "Not started"
    completed = 1 if status == "Completed" else 0
    description = task.description or task.notes or ""

    cursor.execute("""
    INSERT INTO tasks (
        id, title, description, subject, due_date, due_time, priority,
        status, completed, resource_url, completed_at, completion_type, completion_evidence, notes, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        task_id,
        task.title.strip(),
        description.strip(),
        task.subject.strip(),
        task.due_date,
        task.due_time or "18:00",
        task.priority or "Medium",
        status,
        completed,
        task.resource_url.strip() if task.resource_url else None,
        None,
        None,
        None,
        task.notes or "",
        created_at
    ))

    cursor.execute("""
    INSERT INTO activity_logs (id, activity_type, description, timestamp)
    VALUES (?, ?, ?, ?)
    """, (f"log-{uuid.uuid4().hex[:6]}", "task_created", f"Added task: '{task.title}'", created_at))

    conn.commit()
    conn.close()

    return {
        "id": task_id,
        "title": task.title,
        "description": description,
        "subject": task.subject,
        "dueDate": task.due_date,
        "dueTime": task.due_time,
        "priority": task.priority,
        "status": status,
        "completed": bool(completed),
        "resourceUrl": task.resource_url,
        "completedAt": None,
        "completionType": None,
        "completionEvidence": None,
        "notes": task.notes,
        "createdAt": created_at
    }

@app.put("/api/tasks/{task_id}")
def update_task(task_id: str, updates: TaskUpdate):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")

    new_title = updates.title if updates.title is not None else existing["title"]
    new_description = updates.description if updates.description is not None else existing["description"]
    new_subject = updates.subject if updates.subject is not None else existing["subject"]
    new_due_date = updates.due_date if updates.due_date is not None else existing["due_date"]
    new_due_time = updates.due_time if updates.due_time is not None else existing["due_time"]
    new_priority = updates.priority if updates.priority is not None else existing["priority"]
    new_resource_url = updates.resource_url if updates.resource_url is not None else existing["resource_url"]
    new_notes = updates.notes if updates.notes is not None else existing["notes"]

    # Handle status & completion logic
    new_status = updates.status if updates.status is not None else existing["status"]
    if updates.completed is True:
        new_status = "Completed"
    elif updates.completed is False and new_status == "Completed":
        new_status = "In progress"

    new_completed = 1 if new_status == "Completed" else 0

    if new_status == "Completed":
        new_completed_at = updates.completed_at or existing["completed_at"] or datetime.now().isoformat()
        new_completion_type = updates.completion_type or existing["completion_type"] or "self_reported"
        new_completion_evidence = updates.completion_evidence if updates.completion_evidence is not None else existing["completion_evidence"]
    else:
        new_completed_at = None
        new_completion_type = None
        new_completion_evidence = None

    cursor.execute("""
    UPDATE tasks
    SET title = ?, description = ?, subject = ?, due_date = ?, due_time = ?, priority = ?,
        status = ?, completed = ?, resource_url = ?, completed_at = ?, completion_type = ?,
        completion_evidence = ?, notes = ?
    WHERE id = ?
    """, (
        new_title, new_description, new_subject, new_due_date, new_due_time, new_priority,
        new_status, new_completed, new_resource_url, new_completed_at, new_completion_type,
        new_completion_evidence, new_notes, task_id
    ))

    # Activity logging
    if new_status == "Completed" and existing["status"] != "Completed":
        cursor.execute("""
        INSERT INTO activity_logs (id, activity_type, description, timestamp)
        VALUES (?, ?, ?, ?)
        """, (f"log-{uuid.uuid4().hex[:6]}", "task_completed", f"Completed: '{new_title}' ({new_completion_type or 'verified'})", datetime.now().isoformat()))
    elif new_status != "Completed" and existing["status"] == "Completed":
        cursor.execute("""
        INSERT INTO activity_logs (id, activity_type, description, timestamp)
        VALUES (?, ?, ?, ?)
        """, (f"log-{uuid.uuid4().hex[:6]}", "task_reopened", f"Reopened: '{new_title}'", datetime.now().isoformat()))

    conn.commit()
    conn.close()

    return {
        "id": task_id,
        "title": new_title,
        "description": new_description,
        "subject": new_subject,
        "dueDate": new_due_date,
        "dueTime": new_due_time,
        "priority": new_priority,
        "status": new_status,
        "completed": bool(new_completed),
        "resourceUrl": new_resource_url,
        "completedAt": new_completed_at,
        "completionType": new_completion_type,
        "completionEvidence": new_completion_evidence,
        "notes": new_notes
    }

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted", "id": task_id}

# ----------------- STUDY PLANS -----------------

@app.get("/api/plans")
def list_study_plans():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM study_plans ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()

    plans = []
    for r in rows:
        days = json.loads(r["days"])
        topics = json.loads(r["topics"])
        total_subtasks = sum(len(d.get("tasks", [])) for d in days)
        completed_subtasks = sum(sum(1 for t in d.get("tasks", []) if t.get("completed")) for d in days)
        progress_pct = round((completed_subtasks / total_subtasks * 100), 1) if total_subtasks > 0 else 0.0

        plans.append({
            "id": r["id"],
            "title": r["title"],
            "subject": r["subject"],
            "durationDays": r["duration_days"],
            "dailyHours": r["daily_hours"],
            "totalHours": round(r["duration_days"] * r["daily_hours"], 1),
            "topics": topics,
            "days": days,
            "totalTasks": total_subtasks,
            "completedTasks": completed_subtasks,
            "progress": progress_pct,
            "isSample": bool(r["is_sample"]),
            "createdAt": r["created_at"]
        })
    return plans

@app.post("/api/plans")
def create_study_plan(plan: PlanCreate):
    conn = get_connection()
    cursor = conn.cursor()
    plan_id = f"plan-{uuid.uuid4().hex[:8]}"

    # Build day breakdown
    days = []
    topics_list = plan.topics if plan.topics else [f"Module {i+1}" for i in range(plan.duration_days)]
    for i in range(plan.duration_days):
        t_name = topics_list[i % len(topics_list)]
        days.append({
            "day": i + 1,
            "title": t_name,
            "hours": plan.daily_hours,
            "topics": [t_name, f"Practice problem set {i+1}"],
            "tasks": [
                {"id": f"t-{plan_id}-d{i+1}-1", "title": f"Study {t_name}", "completed": False},
                {"id": f"t-{plan_id}-d{i+1}-2", "title": f"Solve practice exercises for {t_name}", "completed": False}
            ]
        })

    cursor.execute("""
    INSERT INTO study_plans (id, title, subject, duration_days, daily_hours, topics, days, is_sample, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    """, (
        plan_id,
        plan.title,
        plan.subject,
        plan.duration_days,
        plan.daily_hours,
        json.dumps(topics_list),
        json.dumps(days),
        datetime.now().isoformat()
    ))

    cursor.execute("""
    INSERT INTO activity_logs (id, activity_type, description, timestamp)
    VALUES (?, ?, ?, ?)
    """, (f"log-{uuid.uuid4().hex[:6]}", "plan_created", f"Created plan: '{plan.title}'", datetime.now().isoformat()))

    conn.commit()
    conn.close()

    return {
        "id": plan_id,
        "title": plan.title,
        "subject": plan.subject,
        "durationDays": plan.duration_days,
        "dailyHours": plan.daily_hours,
        "days": days,
        "progress": 0.0,
        "isSample": False
    }

@app.put("/api/plans/{plan_id}/task")
def toggle_plan_task(plan_id: str, payload: PlanTaskToggle):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT days, title FROM study_plans WHERE id = ?", (plan_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Study plan not found")

    days = json.loads(row["days"])
    updated = False
    task_name = ""

    for d in days:
        if d.get("day") == payload.day_number:
            for t in d.get("tasks", []):
                if t.get("id") == payload.task_id:
                    t["completed"] = payload.completed
                    task_name = t.get("title", "Task")
                    updated = True
                    break

    if updated:
        cursor.execute("UPDATE study_plans SET days = ? WHERE id = ?", (json.dumps(days), plan_id))
        if payload.completed:
            cursor.execute("""
            INSERT INTO activity_logs (id, activity_type, description, timestamp)
            VALUES (?, ?, ?, ?)
            """, (f"log-{uuid.uuid4().hex[:6]}", "plan_milestone", f"Completed plan step: '{task_name}'", datetime.now().isoformat()))
        conn.commit()

    conn.close()
    return {"status": "success", "days": days}

@app.delete("/api/plans/{plan_id}")
def delete_study_plan(plan_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM study_plans WHERE id = ?", (plan_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted", "id": plan_id}

# ----------------- QUIZ CENTER -----------------

@app.get("/api/quizzes/topics")
def get_quiz_topics():
    return [
        {"subject": "Java", "topics": ["Java OOP", "Collections Framework", "Exceptions & Concurrency"], "count": len(QUESTION_BANK["Java"])},
        {"subject": "Data Structures & Algorithms", "topics": ["Arrays & Two Pointers", "Binary Search", "Stacks & Queues", "Linked Lists"], "count": len(QUESTION_BANK["Data Structures & Algorithms"])},
        {"subject": "DBMS", "topics": ["SQL & Joins", "Normalization (1NF-BCNF)", "ACID Transactions", "B+ Trees"], "count": len(QUESTION_BANK["DBMS"])},
        {"subject": "Operating Systems", "topics": ["Processes vs Threads", "Deadlock Prevention", "Virtual Memory & Thrashing"], "count": len(QUESTION_BANK["Operating Systems"])}
    ]

@app.get("/api/quizzes/questions")
def get_quiz_questions(
    subject: str = Query("Data Structures & Algorithms"),
    topic: Optional[str] = Query(None),
    difficulty: str = Query("Intermediate"),
    count: int = Query(5)
):
    result = get_questions_for_subject(
        subject=subject,
        topic=topic,
        difficulty=difficulty,
        count=count
    )
    return result

@app.post("/api/quizzes/submit")
def submit_quiz_score(payload: QuizSubmit):
    conn = get_connection()
    cursor = conn.cursor()
    quiz_id = f"res-{uuid.uuid4().hex[:8]}"
    pct = round((payload.score / payload.total_questions * 100), 1) if payload.total_questions > 0 else 0.0

    cursor.execute("""
    INSERT INTO quiz_results (id, subject, topic, score, total_questions, percentage, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (quiz_id, payload.subject, payload.topic, payload.score, payload.total_questions, pct, datetime.now().isoformat()))

    cursor.execute("""
    INSERT INTO activity_logs (id, activity_type, description, timestamp)
    VALUES (?, ?, ?, ?)
    """, (f"log-{uuid.uuid4().hex[:6]}", "quiz_completed", f"Scored {payload.score}/{payload.total_questions} ({pct}%) on {payload.subject} Quiz", datetime.now().isoformat()))

    conn.commit()
    conn.close()

    return {
        "id": quiz_id,
        "subject": payload.subject,
        "topic": payload.topic,
        "score": payload.score,
        "total": payload.total_questions,
        "percentage": pct
    }

# ----------------- PROGRESS & ANALYTICS -----------------

@app.get("/api/progress")
def get_progress_dashboard():
    conn = get_connection()
    cursor = conn.cursor()

    # Tasks stats with statuses
    cursor.execute("SELECT COUNT(*) FROM tasks")
    total_tasks = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM tasks WHERE completed = 1 OR status = 'Completed'")
    completed_tasks = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM tasks WHERE status = 'In progress' AND completed = 0")
    in_progress_tasks = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM tasks WHERE status = 'Not started' AND completed = 0")
    not_started_tasks = cursor.fetchone()[0]

    # Study plans count and total subtasks
    cursor.execute("SELECT days, duration_days, daily_hours FROM study_plans")
    plan_rows = cursor.fetchall()
    active_plans = len(plan_rows)

    total_plan_hours = sum(r["duration_days"] * r["daily_hours"] for r in plan_rows)
    total_subtasks = 0
    completed_subtasks = 0

    for r in plan_rows:
        days = json.loads(r["days"])
        for d in days:
            for t in d.get("tasks", []):
                total_subtasks += 1
                if t.get("completed"):
                    completed_subtasks += 1

    # Quiz statistics
    cursor.execute("SELECT score, total_questions, percentage, subject, topic, completed_at FROM quiz_results ORDER BY completed_at DESC")
    quiz_rows = cursor.fetchall()

    quiz_history = []
    avg_quiz_score = 0.0
    if quiz_rows:
        total_pct = sum(r["percentage"] for r in quiz_rows)
        avg_quiz_score = round(total_pct / len(quiz_rows), 1)
        for qr in quiz_rows:
            quiz_history.append({
                "subject": qr["subject"],
                "topic": qr["topic"],
                "score": qr["score"],
                "total": qr["total_questions"],
                "percentage": qr["percentage"],
                "completedAt": qr["completed_at"]
            })

    # Recent activities
    cursor.execute("SELECT activity_type, description, timestamp FROM activity_logs ORDER BY timestamp DESC LIMIT 6")
    recent_activity = [
        {"type": row["activity_type"], "description": row["description"], "timestamp": row["timestamp"]}
        for row in cursor.fetchall()
    ]

    # Subject-wise tasks breakdown
    cursor.execute("SELECT subject, COUNT(*) as total, SUM(CASE WHEN completed = 1 OR status = 'Completed' THEN 1 ELSE 0 END) as completed FROM tasks GROUP BY subject")
    subject_stats = []
    for sr in cursor.fetchall():
        s_total = sr["total"]
        s_done = sr["completed"] or 0
        subject_stats.append({
            "subject": sr["subject"],
            "total": s_total,
            "completed": s_done,
            "percentage": round(s_done / s_total * 100, 1) if s_total > 0 else 0
        })

    # Calculate actual study streak dynamically from saved task and quiz dates
    cursor.execute("SELECT DISTINCT substr(completed_at, 1, 10) FROM tasks WHERE (completed = 1 OR status = 'Completed') AND completed_at IS NOT NULL")
    task_dates = {r[0] for r in cursor.fetchall() if r[0]}

    cursor.execute("SELECT DISTINCT substr(completed_at, 1, 10) FROM quiz_results WHERE completed_at IS NOT NULL")
    quiz_dates = {r[0] for r in cursor.fetchall() if r[0]}

    active_dates = sorted(task_dates.union(quiz_dates), reverse=True)

    # Calculate streak counting back from today or yesterday
    current_date = date.today()
    current_streak = 0
    test_date = current_date

    # If nothing done today, allow streak continuation from yesterday
    if test_date.isoformat() not in active_dates:
        test_date = current_date - timedelta(days=1)

    while test_date.isoformat() in active_dates:
        current_streak += 1
        test_date -= timedelta(days=1)

    # Dynamic weekly hours based on actual completed activities in current week
    today_dt = date.today()
    start_of_week = today_dt - timedelta(days=today_dt.weekday()) # Monday

    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    weekly_hours = []

    for i in range(7):
        d_date = (start_of_week + timedelta(days=i)).isoformat()
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE (completed = 1 OR status = 'Completed') AND substr(completed_at, 1, 10) = ?", (d_date,))
        tasks_on_day = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM quiz_results WHERE substr(completed_at, 1, 10) = ?", (d_date,))
        quizzes_on_day = cursor.fetchone()[0]

        hours_calc = round(tasks_on_day * 1.5 + quizzes_on_day * 0.5, 1)
        weekly_hours.append({
            "day": day_names[i],
            "date": d_date,
            "hours": hours_calc,
            "target": 2.0
        })

    # Total logged study hours
    total_task_hours = completed_tasks * 1.5
    total_quiz_hours = len(quiz_history) * 0.5
    total_subtask_hours = completed_subtasks * 0.5
    logged_hours = round(total_task_hours + total_quiz_hours + total_subtask_hours, 1)

    conn.close()

    completion_rate = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0

    return {
        "totalTasks": total_tasks,
        "completedTasks": completed_tasks,
        "inProgressTasks": in_progress_tasks,
        "notStartedTasks": not_started_tasks,
        "completionRate": completion_rate,
        "activePlans": active_plans,
        "totalSubtasks": total_subtasks,
        "completedSubtasks": completed_subtasks,
        "loggedHours": logged_hours,
        "avgQuizScore": avg_quiz_score,
        "currentStreak": current_streak,
        "weeklyActivity": weekly_hours,
        "subjectStats": subject_stats,
        "quizHistory": quiz_history,
        "recentActivity": recent_activity
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
