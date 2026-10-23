"""
StudyMate AI Assistant Engine (Alexa+-inspired simulated agentic assistant)
Executes real application functions and database mutations based on student natural language.
"""

import os
import re
import json
import uuid
from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional
from database import get_connection
from quiz_bank import get_questions_for_subject

class StudyMateAgent:
    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY", "")
        self.gemini_key = os.getenv("GEMINI_API_KEY", "")
        self.mode = "live" if (self.openai_key or self.gemini_key) else "demo"

    def get_status(self) -> Dict[str, Any]:
        return {
            "mode": self.mode,
            "provider": "OpenAI/Gemini" if self.mode == "live" else "Simulated Alexa+ Engine (Local Rule & Semantic Engine)",
            "message": "Connected to Alexa+-inspired Student Intelligence Engine"
        }

    def process_message(self, user_text: str) -> Dict[str, Any]:
        """
        Parses user intent, extracts entities, executes real DB functions,
        and constructs an Alexa+-style response with actionable payload.
        """
        text = user_text.strip()
        lower = text.lower()

        # 1. INTENT: Progress / Study Status (Must be checked before creation keywords)
        # Examples: "How much of my study plan have I completed?", "What is my progress?", "Review my progress", "How am I doing?"
        if any(kw in lower for kw in ["how much", "my progress", "review progress", "review my progress", "completion rate", "how am i doing", "show progress", "have i completed"]):
            return self._handle_get_progress(text)

        # 2. INTENT: Create Study Plan
        # Examples: "Create a 5-day DSA study plan. I can study 2 hours daily.", "Make a study plan"
        if any(kw in lower for kw in ["create a study plan", "make a study plan", "generate a study plan", "create study plan", "make study plan", "exam plan", "dsa study plan", "new study plan"]):
            return self._handle_create_study_plan(text)
        if "plan" in lower and any(v in lower for v in ["create", "generate", "make", "build", "set up", "schedule a plan", "-day"]):
            return self._handle_create_study_plan(text)

        # 2. INTENT: Mark task completed
        # Examples: "Mark my arrays task as completed", "Mark task completed", "I finished the arrays task"
        if ("mark" in lower and "complet" in lower) or ("finish" in lower and "task" in lower) or ("done with" in lower):
            return self._handle_complete_task(text)

        # 3. INTENT: Add Task or Reminder
        # Examples: "Remind me to practice arrays at 6 PM", "Add a task to study OS tomorrow at 4 PM"
        if any(kw in lower for kw in ["remind me", "add task", "new task", "create task", "add a task", "reminder to"]):
            return self._handle_add_task(text)

        # 4. INTENT: Progress / Study Status
        # Examples: "How much of my study plan have I completed?", "What is my progress?", "Review my progress"
        if any(kw in lower for kw in ["how much", "progress", "completion", "how am i doing", "stats", "review my"]):
            return self._handle_get_progress(text)

        # 5. INTENT: Create / Launch Quiz
        # Examples: "Create a quiz about Java OOP", "Quiz me on DSA", "Test my knowledge on DBMS"
        if any(kw in lower for kw in ["quiz", "test me", "question me", "practice test"]):
            return self._handle_generate_quiz(text)

        # 6. INTENT: Organize Daily Schedule
        # Examples: "Help organize a daily schedule", "Plan my day", "What should I study today?"
        if any(kw in lower for kw in ["plan my day", "daily schedule", "organize my day", "study schedule", "what should i study"]):
            return self._handle_organize_schedule(text)

        # 7. INTENT: Conceptual Explanation
        # Examples: "Explain the difference between a stack and a queue", "What is normalization?", "How does QuickSort work?"
        if any(kw in lower for kw in ["explain", "difference between", "what is", "how does", "tell me about"]):
            return self._handle_explanation(text)

        # 8. Ambiguous / Greeting / Fallback
        if any(kw in lower for kw in ["hi", "hello", "hey", "alexa", "help", "who are you"]):
            return {
                "response": "Hello! I am **StudyMate AI**, your personal student companion. I can help you create custom study plans, schedule reminders, quiz your knowledge, explain technical topics, and track your daily productivity.\n\nTry saying or typing:\n- *\"Create a 5-day DSA study plan. I can study 2 hours daily.\"*\n- *\"Remind me to practice arrays at 6 PM.\"*\n- *\"Explain the difference between a stack and a queue.\"*\n- *\"Quiz me on Java OOP.\"*",
                "action": None,
                "suggestions": [
                    "Create a 5-day DSA study plan",
                    "Remind me to practice arrays at 6 PM",
                    "Explain stack vs queue",
                    "Quiz me on Java OOP"
                ]
            }

        # Clarification question when ambiguous
        return {
            "response": f"I understood you're asking about **\"{text}\"**. Would you like me to:\n1. Create a structured study plan for this topic?\n2. Add a study task/reminder to your schedule?\n3. Generate a quick quiz to test your mastery?\n4. Explain the concept step-by-step?",
            "action": None,
            "suggestions": [
                f"Explain {text[:20]}",
                f"Create a study plan for {text[:20]}",
                f"Quiz me on {text[:20]}",
                "Review my progress"
            ]
        }

    # ================= ACTION HANDLERS ================= #

    def _handle_create_study_plan(self, text: str) -> Dict[str, Any]:
        lower = text.lower()
        
        # Extract duration
        duration = 5
        duration_match = re.search(r'(\d+)\s*(-|\s)?day', lower)
        if duration_match:
            duration = int(duration_match.group(1))
            duration = max(1, min(duration, 30)) # clamp 1..30 days

        # Extract daily hours
        hours = 2.0
        hours_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:hour|hr|h)', lower)
        if hours_match:
            hours = float(hours_match.group(1))
            hours = max(0.5, min(hours, 12.0))

        # Extract subject
        subject = "Computer Science"
        if "dsa" in lower or "data structure" in lower or "algorithm" in lower:
            subject = "Data Structures & Algorithms"
            topic_pool = [
                ("Arrays, Two Pointers & Hashing", ["Two Sum & 3Sum", "Sliding Window Maximum", "Prefix Sums"]),
                ("Binary Search & Sorting", ["Rotated Sorted Array", "Merge Sort vs QuickSort", "Peak Finding"]),
                ("Stacks, Queues & Monotonic Stacks", ["Valid Parentheses", "Daily Temperatures", "Min Stack"]),
                ("Linked Lists & Pointers", ["Fast and Slow Pointer Cycle Detection", "Reverse Linked List", "Merge Lists"]),
                ("Trees, BST & Traversals", ["BFS Level Order", "Lowest Common Ancestor", "Validate BST"]),
                ("Dynamic Programming & Recursion", ["Climbing Stairs", "0/1 Knapsack", "Longest Common Subsequence"]),
                ("Graph Algorithms", ["BFS & DFS", "Dijkstra Shortest Path", "Cycle Detection in Directed Graphs"])
            ]
        elif "java" in lower or "oop" in lower:
            subject = "Java Object-Oriented Programming"
            topic_pool = [
                ("Classes, Objects & Encapsulation", ["Constructors & Getters/Setters", "Access Modifiers", "Memory Layout"]),
                ("Inheritance & Polymorphism", ["Method Overriding vs Overloading", "Super keyword", "Dynamic Dispatch"]),
                ("Interfaces & Abstract Classes", ["Default Methods in Java 8", "Functional Interfaces", "Design Patterns"]),
                ("Collections Framework", ["ArrayList vs LinkedList", "HashMap Hashing Mechanism", "TreeSet Ordering"]),
                ("Exceptions & Multithreading", ["Try-Catch-Finally semantics", "Thread Lifecycle", "Synchronized blocks"])
            ]
        elif "dbms" in lower or "sql" in lower or "database" in lower:
            subject = "Database Management Systems (DBMS)"
            topic_pool = [
                ("Relational Model & SQL Queries", ["SELECT with Aggregates & GROUP BY", "INNER vs OUTER Joins", "Subqueries"]),
                ("ER Modeling & Schema Design", ["Entities & Cardinality", "Primary vs Foreign Keys", "Referential Integrity"]),
                ("Normalization & Functional Dependencies", ["1NF, 2NF, and 3NF", "Boyce-Codd Normal Form (BCNF)", "Lossless Join"]),
                ("Transactions & ACID Properties", ["Concurrency Anomalies (Dirty Read)", "Serializability", "Isolation Levels"]),
                ("Indexing & Storage", ["B+ Trees vs Hash Index", "Clustered vs Non-clustered Index", "Query Optimization"])
            ]
        elif "os" in lower or "operating system" in lower:
            subject = "Operating Systems"
            topic_pool = [
                ("Processes & Threads", ["Process State Machine", "Context Switching", "Multithreading Models"]),
                ("CPU Scheduling Algorithms", ["FCFS & SJF", "Round Robin with Time Quantum", "Priority Preemption"]),
                ("Process Synchronization & Deadlocks", ["Semaphores & Mutexes", "Critical Section Problem", "Banker's Algorithm"]),
                ("Virtual Memory & Paging", ["Page Replacement (LRU, FIFO)", "Thrashing", "TLB Translation"]),
                ("File Systems & Disk Scheduling", ["Inodes & Directory Structures", "SSTF & SCAN algorithms", "File Permissions"])
            ]
        else:
            subject = "Software Engineering & Prep"
            topic_pool = [
                ("Core Fundamentals", ["Syntax & Types", "Standard Library", "Data representation"]),
                ("System Design Basics", ["Client-Server Architecture", "REST APIs", "Caching"]),
                ("Problem Solving & Algorithms", ["Complexity Analysis", "Divide & Conquer", "Greedy"]),
                ("Testing & Debugging", ["Unit Testing", "Edge Case Analysis", "Profiling"]),
                ("Mock Interview Review", ["Review weakness areas", "Speed drills", "Self reflection"])
            ]

        # Generate Day Objects
        plan_id = f"plan-{uuid.uuid4().hex[:8]}"
        plan_title = f"{duration}-Day {subject} Accelerator"
        days = []
        selected_topics = []

        for i in range(duration):
            pool_item = topic_pool[i % len(topic_pool)]
            topic_name = pool_item[0]
            subtasks = pool_item[1]
            selected_topics.append(topic_name)

            day_tasks = []
            for j, sub in enumerate(subtasks):
                day_tasks.append({
                    "id": f"task-{plan_id}-d{i+1}-{j+1}",
                    "title": sub,
                    "completed": False
                })

            days.append({
                "day": i + 1,
                "title": topic_name,
                "hours": hours,
                "topics": subtasks,
                "tasks": day_tasks
            })

        # Save to SQLite
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO study_plans (id, title, subject, duration_days, daily_hours, topics, days, is_sample, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            plan_id,
            plan_title,
            subject,
            duration,
            hours,
            json.dumps(selected_topics),
            json.dumps(days),
            0, # user created
            datetime.now().isoformat()
        ))

        # Log Activity
        cursor.execute("""
        INSERT INTO activity_logs (id, activity_type, description, timestamp)
        VALUES (?, ?, ?, ?)
        """, (f"log-{uuid.uuid4().hex[:6]}", "plan_created", f"Created '{plan_title}' ({duration} days, {hours}h/day)", datetime.now().isoformat()))

        conn.commit()
        conn.close()

        plan_summary = {
            "id": plan_id,
            "title": plan_title,
            "subject": subject,
            "duration": duration,
            "dailyHours": hours,
            "totalHours": duration * hours,
            "totalTasks": sum(len(d["tasks"]) for d in days),
            "days": days
        }

        return {
            "response": f"I've prepared a comprehensive **{duration}-day {subject} study plan** tailored for your **{hours} hours daily** commitment ({duration * hours} total study hours).\n\n"
                        f"Each day is divided into targeted milestones with actionable exercises and time allocations. You can view, track, and complete tasks directly in the **Study Plans** view.",
            "action": {
                "type": "STUDY_PLAN_CREATED",
                "entity": "study_plan",
                "data": plan_summary
            },
            "suggestions": [
                "Open Study Plans",
                "Remind me for Day 1",
                "Quiz me on " + subject,
                "What is my progress?"
            ]
        }

    def _handle_add_task(self, text: str) -> Dict[str, Any]:
        lower = text.lower()
        
        # Extract time
        time_str = "18:00"
        time_match = re.search(r'(\d{1,2}(?::\d{2})?)\s*(am|pm)', lower)
        if time_match:
            t_val = time_match.group(1)
            ampm = time_match.group(2)
            if ":" in t_val:
                h, m = t_val.split(":")
            else:
                h, m = t_val, "00"
            h_int = int(h)
            if ampm == "pm" and h_int < 12:
                h_int += 12
            elif ampm == "am" and h_int == 12:
                h_int = 0
            time_str = f"{h_int:02d}:{m}"

        # Extract date
        due_date = date.today().isoformat()
        if "tomorrow" in lower:
            due_date = (date.today() + timedelta(days=1)).isoformat()
        elif "in 2 days" in lower or "day after tomorrow" in lower:
            due_date = (date.today() + timedelta(days=2)).isoformat()

        # Subject extraction
        subject = "General Study"
        if "dsa" in lower or "array" in lower or "tree" in lower or "graph" in lower or "pointer" in lower:
            subject = "Data Structures"
        elif "java" in lower or "oop" in lower:
            subject = "Java OOP"
        elif "dbms" in lower or "sql" in lower:
            subject = "DBMS"
        elif "os" in lower or "operating" in lower:
            subject = "Operating Systems"

        # Clean title
        clean_title = text
        # Remove trigger prefixes
        for prefix in ["remind me to", "add a task to", "add task to", "new task to", "remind me", "add task"]:
            idx = lower.find(prefix)
            if idx != -1:
                clean_title = text[idx + len(prefix):].strip()
                break

        # Remove trailing time/date clauses from title
        clean_title = re.sub(r'(?i)\s+at\s+\d{1,2}(:\d{2})?\s*(am|pm)?', '', clean_title)
        clean_title = re.sub(r'(?i)\s+today', '', clean_title)
        clean_title = re.sub(r'(?i)\s+tomorrow', '', clean_title)
        clean_title = clean_title.strip()
        if not clean_title:
            clean_title = "Study session: " + subject

        # Capitalize nicely
        clean_title = clean_title[0].upper() + clean_title[1:]

        task_id = f"task-{uuid.uuid4().hex[:8]}"
        priority = "High" if ("important" in lower or "urgent" in lower or "exam" in lower or "dsa" in lower) else "Medium"

        # Check for URL in prompt if user mentioned one
        url_match = re.search(r'https?://[^\s]+', text)
        resource_url = url_match.group(0) if url_match else None

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO tasks (
            id, title, description, subject, due_date, due_time, priority,
            status, completed, resource_url, notes, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Not started', 0, ?, ?, ?)
        """, (
            task_id,
            clean_title,
            clean_title,
            subject,
            due_date,
            time_str,
            priority,
            resource_url,
            "Scheduled via Alexa+ Assistant prompt",
            datetime.now().isoformat()
        ))

        cursor.execute("""
        INSERT INTO activity_logs (id, activity_type, description, timestamp)
        VALUES (?, ?, ?, ?)
        """, (f"log-{uuid.uuid4().hex[:6]}", "task_created", f"Added task: '{clean_title}' at {time_str}", datetime.now().isoformat()))

        conn.commit()
        conn.close()

        task_data = {
            "id": task_id,
            "title": clean_title,
            "description": clean_title,
            "subject": subject,
            "dueDate": due_date,
            "dueTime": time_str,
            "priority": priority,
            "status": "Not started",
            "completed": False,
            "resourceUrl": resource_url,
            "notes": "Scheduled via Alexa+ Assistant"
        }

        friendly_date = "today" if due_date == date.today().isoformat() else "tomorrow"
        return {
            "response": f"Got it! I have scheduled a reminder for **\"{clean_title}\"** on **{friendly_date} at {time_str}**.\n\n"
                        f"It is filed under **{subject}** with **{priority} priority**. Your dashboard and task list have been updated.",
            "action": {
                "type": "TASK_CREATED",
                "entity": "task",
                "data": task_data
            },
            "suggestions": [
                "View My Tasks",
                "Mark my arrays task as completed",
                "What is my schedule today?",
                "Quiz me on " + subject
            ]
        }

    def _handle_complete_task(self, text: str) -> Dict[str, Any]:
        lower = text.lower()
        conn = get_connection()
        cursor = conn.cursor()

        # Find incomplete tasks
        cursor.execute("SELECT id, title, subject, due_date, due_time FROM tasks WHERE completed = 0")
        rows = cursor.fetchall()

        matched_task = None
        # Try finding by keyword
        for r in rows:
            t_title = r["title"].lower()
            words = [w for w in ["array", "java", "dbms", "os", "binary", "pointer", "oop", "sql", "practice"] if w in lower]
            if any(w in t_title for w in words):
                matched_task = r
                break

        # If no specific keyword matched, grab the first pending task
        if not matched_task and len(rows) > 0:
            matched_task = rows[0]

        if not matched_task:
            conn.close()
            return {
                "response": "All your current tasks are already completed! Great job staying ahead. Would you like to create a new task or study plan?",
                "action": None,
                "suggestions": ["Add a new task", "Create a 5-day study plan", "Quiz me on DSA"]
            }

        task_id = matched_task["id"]
        task_title = matched_task["title"]
        now_iso = datetime.now().isoformat()

        cursor.execute("""
        UPDATE tasks
        SET completed = 1, status = 'Completed', completed_at = ?, completion_type = 'self_reported', completion_evidence = 'Completed via conversational assistant'
        WHERE id = ?
        """, (now_iso, task_id))

        cursor.execute("""
        INSERT INTO activity_logs (id, activity_type, description, timestamp)
        VALUES (?, ?, ?, ?)
        """, (f"log-{uuid.uuid4().hex[:6]}", "task_completed", f"Completed: '{task_title}' (voice/assistant confirmed)", now_iso))
        conn.commit()

        # Get updated count
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE completed = 1")
        completed_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM tasks")
        total_count = cursor.fetchone()[0]
        conn.close()

        pct = round((completed_count / total_count * 100), 1) if total_count > 0 else 100.0

        return {
            "response": f"Awesome work! I've marked **\"{task_title}\"** as **completed**.\n\n"
                        f"Your task completion rate is now **{pct}%** ({completed_count} of {total_count} tasks done). Keep the momentum going!",
            "action": {
                "type": "TASK_COMPLETED",
                "entity": "task",
                "data": {"id": task_id, "title": task_title, "completed": True, "newPercentage": pct}
            },
            "suggestions": [
                "Review my progress",
                "What is next on my schedule?",
                "Quiz me on Data Structures"
            ]
        }

    def _handle_get_progress(self, text: str) -> Dict[str, Any]:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM tasks")
        total_tasks = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM tasks WHERE completed = 1 OR status = 'Completed'")
        completed_tasks = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM tasks WHERE status = 'In progress' AND completed = 0")
        in_progress_tasks = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM tasks WHERE status = 'Not started' AND completed = 0")
        not_started_tasks = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM study_plans")
        active_plans = cursor.fetchone()[0]

        cursor.execute("SELECT AVG(percentage), COUNT(*) FROM quiz_results")
        quiz_row = cursor.fetchone()
        avg_quiz = round(quiz_row[0] or 0.0, 1)
        quiz_count = quiz_row[1]

        # Calculate estimated study hours
        cursor.execute("SELECT SUM(duration_days * daily_hours) FROM study_plans")
        plan_hours = cursor.fetchone()[0] or 10.0
        logged_hours = round(min(plan_hours, completed_tasks * 1.5 + quiz_count * 0.5), 1)

        # Dynamic streak calculation
        cursor.execute("SELECT DISTINCT substr(completed_at, 1, 10) FROM tasks WHERE (completed = 1 OR status = 'Completed') AND completed_at IS NOT NULL")
        task_dates = {r[0] for r in cursor.fetchall() if r[0]}

        cursor.execute("SELECT DISTINCT substr(completed_at, 1, 10) FROM quiz_results WHERE completed_at IS NOT NULL")
        quiz_dates = {r[0] for r in cursor.fetchall() if r[0]}

        active_dates = sorted(task_dates.union(quiz_dates), reverse=True)
        current_date = date.today()
        streak_days = 0
        test_date = current_date
        if test_date.isoformat() not in active_dates:
            test_date = current_date - timedelta(days=1)
        while test_date.isoformat() in active_dates:
            streak_days += 1
            test_date -= timedelta(days=1)

        conn.close()

        pct = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0

        return {
            "response": f"Here is your real-time academic progress summary:\n\n"
                        f"- **Task Completion**: {completed_tasks}/{total_tasks} tasks ({pct}%)\n"
                        f"- **Status**: {in_progress_tasks} in progress, {not_started_tasks} not started\n"
                        f"- **Active Study Plans**: {active_plans}\n"
                        f"- **Logged Study Time**: {logged_hours} hours\n"
                        f"- **Average Quiz Score**: {avg_quiz}%\n"
                        f"- **Current Study Streak**: {streak_days} days in a row\n\n"
                        f"{'You are on track for your upcoming exams!' if pct >= 50 else 'You have several pending milestones for today. Ready to tackle one?'}",
            "action": {
                "type": "PROGRESS_SUMMARY",
                "entity": "progress",
                "data": {
                    "totalTasks": total_tasks,
                    "completedTasks": completed_tasks,
                    "inProgressTasks": in_progress_tasks,
                    "notStartedTasks": not_started_tasks,
                    "completionRate": pct,
                    "activePlans": active_plans,
                    "loggedHours": logged_hours,
                    "avgQuizScore": avg_quiz,
                    "streak": streak_days
                }
            },
            "suggestions": [
                "Open Progress Dashboard",
                "What should I study today?",
                "Quiz me on Java OOP"
            ]
        }

    def _handle_generate_quiz(self, text: str) -> Dict[str, Any]:
        lower = text.lower()
        subject = "Data Structures & Algorithms"
        topic = "General Concepts"

        # Check for arbitrary subject / topic pattern
        match = re.search(r'(?:quiz\s+(?:me\s+on|about)|test\s+(?:me\s+on|my\s+knowledge\s+on))\s+(.+)', lower)
        if match:
            extracted = match.group(1).strip()
            extracted = re.sub(r'[?.!]+$', '', extracted).strip()
            if extracted:
                subject = extracted.title()
                topic = extracted.title()
        elif "java" in lower or "oop" in lower:
            subject = "Java"
            topic = "Java OOP & Concurrency"
        elif "dbms" in lower or "sql" in lower:
            subject = "DBMS"
            topic = "SQL, ACID, Normalization"
        elif "os" in lower or "operating" in lower:
            subject = "Operating Systems"
            topic = "Process Scheduling & Deadlocks"

        quiz_res = get_questions_for_subject(subject=subject, topic=topic, count=5)
        questions = quiz_res.get("questions", [])
        mode = quiz_res.get("mode", "curated_bank")
        provider = quiz_res.get("provider", "StudyMate Question Engine")

        quiz_id = quiz_res.get("id") or f"quiz-{uuid.uuid4().hex[:8]}"

        quiz_data = {
            "id": quiz_id,
            "subject": subject,
            "topic": topic,
            "totalQuestions": len(questions),
            "mode": mode,
            "provider": provider,
            "notice": quiz_res.get("notice"),
            "questions": questions
        }

        if mode == "ai_generated":
            mode_desc = f"powered by **{provider}**"
        elif mode == "curated_bank":
            mode_desc = "from our curated technical question bank"
        else:
            mode_desc = "assembled using the **StudyMate offline demo generator**"

        return {
            "response": f"I've generated a 5-question interactive quiz on **{subject}** ({mode_desc}).\n\n"
                        f"It covers key concepts with immediate feedback, detailed explanations, and score tracking. Ready to test your mastery?",
            "action": {
                "type": "QUIZ_GENERATED",
                "entity": "quiz",
                "data": quiz_data
            },
            "suggestions": [
                "Launch Quiz Now",
                "Quiz me on Python AsyncIO",
                "Quiz me on Quantum Computing",
                "Review my progress"
            ]
        }

    def _handle_organize_schedule(self, text: str) -> Dict[str, Any]:
        conn = get_connection()
        cursor = conn.cursor()
        today = date.today().isoformat()
        cursor.execute("SELECT id, title, subject, due_time, priority, completed FROM tasks WHERE due_date = ? ORDER BY due_time ASC", (today,))
        tasks = cursor.fetchall()
        conn.close()

        schedule_items = []
        if len(tasks) > 0:
            for t in tasks:
                schedule_items.append({
                    "time": t["due_time"] or "18:00",
                    "title": t["title"],
                    "subject": t["subject"],
                    "priority": t["priority"],
                    "completed": bool(t["completed"])
                })
        else:
            # Fallback suggested schedule
            schedule_items = [
                {"time": "09:00", "title": "Deep Focus: Data Structures practice", "subject": "DSA", "priority": "High", "completed": False},
                {"time": "14:00", "title": "Core Theory Revision & Flashcards", "subject": "DBMS/OS", "priority": "Medium", "completed": False},
                {"time": "18:00", "title": "Practice Quiz & Coding Implementation", "subject": "Java", "priority": "High", "completed": False}
            ]

        res_text = "Here is your optimized daily study schedule:\n\n"
        for item in schedule_items:
            status_emoji = "[DONE]" if item.get("completed") else "[TODO]"
            res_text += f"- **{item['time']}** — {item['title']} ({item['subject']}) {status_emoji}\n"
        res_text += "\nSpacing your sessions with 15-minute breaks will maximize retention."

        return {
            "response": res_text,
            "action": {
                "type": "SCHEDULE_ORGANIZED",
                "entity": "schedule",
                "data": {"schedule": schedule_items}
            },
            "suggestions": [
                "Remind me at 6 PM",
                "Mark first task completed",
                "View My Tasks"
            ]
        }

    def _handle_explanation(self, text: str) -> Dict[str, Any]:
        lower = text.lower()

        if "stack" in lower and "queue" in lower:
            explanation = (
                "### Difference Between a Stack and a Queue\n\n"
                "Both are linear abstract data structures, but they differ fundamentally in the **order of element insertion and removal**:\n\n"
                "| Feature | Stack | Queue |\n"
                "| :--- | :--- | :--- |\n"
                "| **Principle** | **LIFO** (Last In, First Out) | **FIFO** (First In, First Out) |\n"
                "| **Insert Point** | Top (`push`) | Rear/Tail (`enqueue`) |\n"
                "| **Removal Point**| Top (`pop`) | Front/Head (`dequeue`) |\n"
                "| **Real-world Analogy** | Stack of dinner plates | People waiting in an Amazon delivery queue |\n"
                "| **Primary Use Cases** | Function call stacks, Undo/Redo, DFS traversal | CPU task scheduling, BFS traversal, printer queues |\n\n"
                "#### Java Code Comparison:\n"
                "```java\n"
                "// Stack (LIFO)\n"
                "Deque<Integer> stack = new ArrayDeque<>();\n"
                "stack.push(10); stack.push(20);\n"
                "int top = stack.pop(); // Returns 20\n\n"
                "// Queue (FIFO)\n"
                "Queue<Integer> queue = new ArrayDeque<>();\n"
                "queue.offer(10); queue.offer(20);\n"
                "int front = queue.poll(); // Returns 10\n"
                "```\n\n"
                "**Key takeaway:** If you need to reverse order or backtrack, use a **Stack**. If you need sequential fair processing, use a **Queue**."
            )
            return {
                "response": explanation,
                "action": None,
                "suggestions": [
                    "Quiz me on Stacks and Queues",
                    "Add task to practice Stack questions",
                    "Explain Binary Search"
                ]
            }

        elif "polymorphism" in lower or "oop" in lower:
            explanation = (
                "### Polymorphism in Object-Oriented Programming\n\n"
                "**Polymorphism** (from Greek *poly* = many, *morph* = forms) is the ability of an object or method to behave in multiple ways depending on runtime context.\n\n"
                "#### The Two Types in Java/C++:\n\n"
                "1. **Compile-Time Polymorphism (Method Overloading)**:\n"
                "   - Methods share the same name within one class but have **different parameter signatures**.\n"
                "   - *Resolved by compiler at build time* (Static binding).\n\n"
                "2. **Runtime Polymorphism (Method Overriding)**:\n"
                "   - A subclass provides a specific implementation of a method defined in its parent class (`@Override`).\n"
                "   - *Resolved at runtime* via the virtual method table (Dynamic dispatch).\n\n"
                "```java\n"
                "class Animal { void makeSound() { System.out.println(\"Some sound\"); } }\n"
                "class Dog extends Animal { void makeSound() { System.out.println(\"Woof!\"); } }\n\n"
                "Animal myPet = new Dog(); // Upcasting\n"
                "myPet.makeSound(); // Prints 'Woof!' at runtime\n"
                "```"
            )
            return {
                "response": explanation,
                "action": None,
                "suggestions": [
                    "Quiz me on Java OOP",
                    "Explain Interfaces vs Abstract Classes",
                    "Create a 5-day Java study plan"
                ]
            }

        elif "normalization" in lower or "normal form" in lower:
            explanation = (
                "### Database Normalization Explained\n\n"
                "**Normalization** is the systematic database design technique of organizing tables to **minimize data redundancy** and avoid update/delete anomalies.\n\n"
                "#### The Core Normal Forms:\n\n"
                "- **1NF (First Normal Form)**: Each column contains **atomic (indivisible)** values. No repeating groups or comma-separated lists.\n"
                "- **2NF (Second Normal Form)**: Must be in 1NF **AND** all non-key attributes must depend on the *entire* primary key (no partial functional dependencies).\n"
                "- **3NF (Third Normal Form)**: Must be in 2NF **AND** no non-key attribute depends on another non-key attribute (no transitive dependencies: `A -> B -> C`).\n"
                "- **BCNF (Boyce-Codd Normal Form)**: Stricter 3NF. For every functional dependency `X -> Y`, `X` must be a super key.\n\n"
                "**Pro-tip for exams:** 2NF tackles composite keys; 3NF eliminates transitive leaks between non-prime attributes."
            )
            return {
                "response": explanation,
                "action": None,
                "suggestions": [
                    "Quiz me on DBMS",
                    "Explain ACID transactions",
                    "Add task to study SQL Joins"
                ]
            }

        # Generic explanation
        return {
            "response": f"### Understanding {text}\n\n"
                        f"Here is a breakdown of **{text}**:\n\n"
                        f"1. **Core Concept**: Understanding how the components interact under standard constraints.\n"
                        f"2. **Time & Space Trade-offs**: In computer science systems, optimizing for latency often requires trading off additional memory cache.\n"
                        f"3. **Practical Implementation**: Focus on edge cases like null values, empty collections, and boundary condition handling.\n\n"
                        f"Would you like me to generate a tailored study plan or launch a quick quiz to practice this topic?",
            "action": None,
            "suggestions": [
                f"Quiz me on {text[:25]}",
                f"Create a study plan for {text[:25]}",
                "Review my progress"
            ]
        }
