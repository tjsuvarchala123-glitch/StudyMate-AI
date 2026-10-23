"""
Quiz Bank and Dynamic Question Generator for StudyMate AI.
Supports both curated question banks and dynamic question generation
for arbitrary topics via configured AI providers (OpenAI / Gemini)
or transparent offline fallback generator (Demo Mode).
"""

import os
import json
import uuid
import re
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional

# Curated High-Yield Question Bank for Standard CS Topics
QUESTION_BANK = {
    "Java": [
        {
            "id": "java-1",
            "question": "Which OOP concept is demonstrated by having multiple methods in the same class with the same name but different parameters?",
            "options": [
                "Method Overriding (Runtime Polymorphism)",
                "Method Overloading (Compile-time Polymorphism)",
                "Encapsulation",
                "Multiple Inheritance"
            ],
            "correctAnswer": 1,
            "explanation": "Method Overloading allows a class to define multiple methods with identical names but differing parameter types, counts, or orders. It is resolved at compile-time."
        },
        {
            "id": "java-2",
            "question": "In Java 8 and later, how can an interface provide concrete method implementations without breaking existing implementers?",
            "options": [
                "Using the 'abstract' keyword",
                "Using the 'default' keyword",
                "Using private constructors",
                "Using static final classes"
            ],
            "correctAnswer": 1,
            "explanation": "The 'default' keyword permits interfaces to define standard implementations of methods, preserving backward compatibility with legacy implementing classes."
        },
        {
            "id": "java-3",
            "question": "What is the time complexity of searching for an element in a HashMap with a well-distributed hash function?",
            "options": [
                "O(log N)",
                "O(N)",
                "O(1) average time",
                "O(N log N)"
            ],
            "correctAnswer": 2,
            "explanation": "A HashMap computes the bucket index via hashCode() and achieves O(1) expected lookup time. In worst-case bucket collisions (prior to treeification), it could degrade to O(N)."
        },
        {
            "id": "java-4",
            "question": "Which collection guarantees that elements are maintained in sorted ascending order?",
            "options": [
                "HashSet",
                "LinkedHashSet",
                "TreeSet",
                "ArrayList"
            ],
            "correctAnswer": 2,
            "explanation": "TreeSet is backed by a Red-Black Tree (TreeMap) and stores elements sorted according to natural ordering or a supplied Comparator."
        },
        {
            "id": "java-5",
            "question": "What happens if an unhandled Exception occurs inside a thread in Java?",
            "options": [
                "The entire JVM terminates immediately",
                "Only the faulting thread terminates, printing the stack trace to stderr",
                "The exception is automatically propagated to the main thread",
                "The thread automatically retries execution from the beginning"
            ],
            "correctAnswer": 1,
            "explanation": "By default, an uncaught exception terminates that specific thread while other non-daemon threads continue running normally unless an UncaughtExceptionHandler intervenes."
        }
    ],
    "Data Structures & Algorithms": [
        {
            "id": "dsa-1",
            "question": "What is the primary difference between a Stack and a Queue in terms of element access?",
            "options": [
                "Stack is FIFO (First-In-First-Out); Queue is LIFO (Last-In-First-Out)",
                "Stack is LIFO (Last-In-First-Out); Queue is FIFO (First-In-First-Out)",
                "Stack allows random index access in O(1); Queue does not",
                "Stack is dynamic in size; Queue has fixed size"
            ],
            "correctAnswer": 1,
            "explanation": "A Stack operates on LIFO (the last pushed item is popped first, like a stack of plates). A Queue operates on FIFO (the first enqueued item is dequeued first, like people in a checkout line)."
        },
        {
            "id": "dsa-2",
            "question": "What is the worst-case time complexity of QuickSort when picking the first or last element as pivot on an already sorted array?",
            "options": [
                "O(N log N)",
                "O(N)",
                "O(N^2)",
                "O(log N)"
            ],
            "correctAnswer": 2,
            "explanation": "Unbalanced partitions on sorted input produce partitions of size 1 and N-1 at each step, yielding a quadratic recursion tree of depth N, hence O(N^2)."
        },
        {
            "id": "dsa-3",
            "question": "Which algorithm finds the shortest path between all pairs of vertices in a weighted graph?",
            "options": [
                "Dijkstra's Algorithm",
                "Floyd-Warshall Algorithm",
                "Kruskal's Algorithm",
                "Breadth First Search (BFS)"
            ],
            "correctAnswer": 1,
            "explanation": "Floyd-Warshall is a dynamic programming algorithm computing all-pairs shortest paths in O(V^3) time. Dijkstra is single-source."
        },
        {
            "id": "dsa-4",
            "question": "How can you detect a cycle in a singly linked list in O(N) time and O(1) auxiliary space?",
            "options": [
                "Using a Hash Set of visited node references",
                "Floyd's Tortoise and Hare (Slow and Fast Pointers)",
                "Reversing the list twice and comparing heads",
                "Sorting the node memory addresses"
            ],
            "correctAnswer": 1,
            "explanation": "Floyd's cycle-finding algorithm moves a slow pointer by 1 step and a fast pointer by 2 steps. If a loop exists, they will collide in O(N) steps without extra memory."
        },
        {
            "id": "dsa-5",
            "question": "What is the optimal auxiliary space complexity of an in-place Invert Binary Tree using recursive DFS?",
            "options": [
                "O(1)",
                "O(h) where h is tree height (call stack)",
                "O(N^2)",
                "O(N log N)"
            ],
            "correctAnswer": 1,
            "explanation": "Because no new node allocations are made, the space consumption is bounded solely by the recursion call stack, which is O(h) (O(log N) for balanced trees, O(N) worst case)."
        }
    ],
    "DBMS": [
        {
            "id": "dbms-1",
            "question": "Which normal form requires eliminating partial dependency of non-key attributes on any candidate key?",
            "options": [
                "First Normal Form (1NF)",
                "Second Normal Form (2NF)",
                "Third Normal Form (3NF)",
                "Boyce-Codd Normal Form (BCNF)"
            ],
            "correctAnswer": 1,
            "explanation": "2NF mandates that the relation is in 1NF and no non-prime attribute is functionally dependent on a proper subset of any candidate key (no partial dependencies)."
        },
        {
            "id": "dbms-2",
            "question": "What does the 'I' in ACID transaction properties stand for, and what does it guarantee?",
            "options": [
                "Indexing: Ensures queries run quickly",
                "Integrity: Ensures primary keys are not null",
                "Isolation: Ensures concurrent transactions do not interfere with each other",
                "Idempotence: Repeating an operation yields identical results"
            ],
            "correctAnswer": 2,
            "explanation": "Isolation prevents race conditions and dirty reads when multiple transactions execute concurrently, providing levels such as Read Committed, Repeatable Read, and Serializable."
        },
        {
            "id": "dbms-3",
            "question": "Why do relational databases predominantly use B+ Trees instead of standard Binary Search Trees for disk indices?",
            "options": [
                "B+ Trees consume zero memory",
                "B+ Trees have high fan-out, minimizing disk I/O seek operations, and leaf nodes form a linked list for fast range queries",
                "Binary Search Trees cannot store numeric values",
                "B+ Trees eliminate the need for primary keys"
            ],
            "correctAnswer": 1,
            "explanation": "Disk block reads are orders of magnitude slower than CPU operations. B+ Trees have large branching factors (fan-out of 100+), shallow depth (3-4 levels), and sequential leaf chaining for range scans."
        },
        {
            "id": "dbms-4",
            "question": "What is the result of a LEFT OUTER JOIN between table A (left) and table B (right)?",
            "options": [
                "Only rows that match in both tables",
                "All rows from table B, with nulls for missing table A rows",
                "All rows from table A, plus matched rows from table B (with nulls for non-matching B attributes)",
                "The Cartesian product of both tables"
            ],
            "correctAnswer": 2,
            "explanation": "LEFT OUTER JOIN returns all rows from the left table along with matching rows from the right table. For non-matching left rows, right columns will contain NULL."
        }
    ],
    "Operating Systems": [
        {
            "id": "os-1",
            "question": "Which condition is NOT one of Coffman's four necessary conditions for a Deadlock to occur?",
            "options": [
                "Mutual Exclusion",
                "Hold and Wait",
                "Preemption Allowed",
                "Circular Wait"
            ],
            "correctAnswer": 2,
            "explanation": "The condition is 'No Preemption' (resources cannot be forcibly confiscated). If preemption is allowed, deadlocks can be broken or prevented."
        },
        {
            "id": "os-2",
            "question": "What is thrashing in the context of virtual memory management?",
            "options": [
                "A CPU executing arithmetic instructions at maximum clock frequency",
                "The operating system spending more time swapping pages between RAM and disk than executing user processes",
                "Multiple threads deadlocking on a mutex",
                "A disk controller failing due to high read/write cycles"
            ],
            "correctAnswer": 1,
            "explanation": "Thrashing occurs when the total working sets of active processes exceed available physical memory, causing continuous page faults and extreme disk thrashing."
        },
        {
            "id": "os-3",
            "question": "What is the difference between a Process and a Thread?",
            "options": [
                "Processes share memory space, whereas Threads have separate address spaces",
                "A Thread is an independent program; a Process is a function",
                "A Process has its own address space and system resources; Threads within a process share code, data, and open files while having their own stack and registers",
                "Operating systems can only schedule Processes, never Threads"
            ],
            "correctAnswer": 2,
            "explanation": "A process is an isolated executing program instance with its own virtual memory space. Threads ('lightweight processes') exist inside a process and share its heap, global variables, and descriptors."
        }
    ]
}

def _generate_via_openai(subject: str, topic: str, difficulty: str, count: int, api_key: str) -> Optional[List[Dict[str, Any]]]:
    """Call OpenAI API to generate multiple choice questions."""
    try:
        url = "https://api.openai.com/v1/chat/completions"
        system_prompt = (
            "You are an expert academic educator. Generate a multiple-choice quiz based on the user's topic. "
            "Output MUST be valid JSON only, without any markdown formatting or backticks, with the following schema:\n"
            "{\n"
            '  "questions": [\n'
            '    {\n'
            '      "id": "string",\n'
            '      "question": "string",\n'
            '      "options": ["string", "string", "string", "string"],\n'
            '      "correctAnswer": 0,\n'
            '      "explanation": "string"\n'
            "    }\n"
            "  ]\n"
            "}"
        )
        user_prompt = f"Subject: {subject}\nSpecific Topic: {topic}\nDifficulty Level: {difficulty}\nNumber of Questions: {count}"

        payload = json.dumps({
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.5,
            "response_format": {"type": "json_object"}
        }).encode("utf-8")

        req = urllib.request.Request(
            url,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            }
        )

        with urllib.request.urlopen(req, timeout=12) as response:
            result = json.loads(response.read().decode("utf-8"))
            content = result["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            questions = parsed.get("questions", [])
            if _validate_questions(questions):
                return questions[:count]
    except Exception as e:
        print(f"[OpenAI Quiz Generator Error]: {e}")
    return None

def _generate_via_gemini(subject: str, topic: str, difficulty: str, count: int, api_key: str) -> Optional[List[Dict[str, Any]]]:
    """Call Gemini API to generate multiple choice questions."""
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        prompt_text = (
            f"Generate a {count}-question multiple-choice quiz on Subject: '{subject}', Topic: '{topic}', Difficulty: '{difficulty}'. "
            "Output JSON only without backticks with format: "
            '{"questions": [{"id": "1", "question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "..."}]}'
        )

        payload = json.dumps({
            "contents": [{"parts": [{"text": prompt_text}]}],
            "generationConfig": {"responseMimeType": "application/json"}
        }).encode("utf-8")

        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=12) as response:
            result = json.loads(response.read().decode("utf-8"))
            candidate = result["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(candidate)
            questions = parsed.get("questions", [])
            if _validate_questions(questions):
                return questions[:count]
    except Exception as e:
        print(f"[Gemini Quiz Generator Error]: {e}")
    return None

def _validate_questions(questions: Any) -> bool:
    """Validate that questions follow the required contract."""
    if not isinstance(questions, list) or len(questions) == 0:
        return False
    for q in questions:
        if not isinstance(q, dict):
            return False
        if not q.get("question") or not isinstance(q.get("options"), list):
            return False
        if len(q["options"]) != 4:
            return False
        if not isinstance(q.get("correctAnswer"), int) or q["correctAnswer"] not in [0, 1, 2, 3]:
            return False
        if not q.get("explanation"):
            return False
    return True

def _generate_dynamic_fallback(subject: str, topic: str, difficulty: str, count: int) -> List[Dict[str, Any]]:
    """
    High-quality offline educational question generator for arbitrary topics.
    Used when no external AI API key is configured, ensuring the app works
    for ANY subject/topic without returning unrelated DSA questions or fake AI claims.
    """
    clean_topic = topic.strip() if topic else subject.strip()
    clean_subj = subject.strip()

    templates = [
        {
            "template": "What is the primary fundamental objective or core principle behind {topic} in {subject}?",
            "opt_gen": lambda t, s, d: [
                f"To systematically organize, optimize, and analyze patterns in {t}",
                f"To replace all underlying hardware architectures with proprietary protocols",
                f"To eliminate the need for error handling and boundary conditions in {s}",
                f"To enforce strict sequential single-threaded execution across distributed nodes"
            ],
            "correct": 0,
            "expl_gen": lambda t, s, d: f"In {s}, {t} primarily focuses on structured problem modeling, resource efficiency, and correctness under varying operational constraints."
        },
        {
            "template": "When analyzing performance trade-offs in {topic}, which factor typically presents the greatest bottleneck?",
            "opt_gen": lambda t, s, d: [
                f"Constant optical clock skew across local CPU registers",
                f"Time-space trade-offs between memory overhead, I/O latency, and computational complexity",
                f"The operating system having zero available registers",
                f"Display refresh rates causing logic instruction drops"
            ],
            "correct": 1,
            "expl_gen": lambda t, s, d: f"Across modern {s} systems, optimizing {t} requires balancing latency, memory footprint, cache locality, and throughput."
        },
        {
            "template": "Which of the following represents an essential best practice or invariant when implementing {topic}?",
            "opt_gen": lambda t, s, d: [
                f"Hardcoding magic constant offsets directly into production modules",
                f"Bypassing data validation layers to maximize raw throughput",
                f"Verifying boundary edge cases, validating preconditions, and maintaining invariants",
                f"Disabling compiler warnings and type-checking mechanisms"
            ],
            "correct": 2,
            "expl_gen": lambda t, s, d: f"Robust implementations of {t} mandate strict verification of boundary states (e.g. null references, overflow, empty collections, and race conditions)."
        },
        {
            "template": "How does {difficulty} difficulty problem solving in {topic} typically differ from introductory foundations?",
            "opt_gen": lambda t, s, d: [
                f"{d} applications require reasoning about corner cases, asymptotic scalability, and concurrency safety",
                f"{d} applications eliminate the need for unit testing and profiling",
                f"{d} applications exclusively use brute-force linear search over datasets",
                f"{d} applications cannot run on standard operating systems"
            ],
            "correct": 0,
            "expl_gen": lambda t, s, d: f"As complexity advances in {t}, students must account for edge constraints, non-trivial scaling behaviors, and algorithmic trade-offs."
        },
        {
            "template": "In {subject}, what is the standard consequence of failing to isolate side effects in {topic}?",
            "opt_gen": lambda t, s, d: [
                f"Instant physical damage to storage device sectors",
                f"State pollution, non-deterministic bugs, and difficulty in regression testing",
                f"The compiler automatically converting all code to assembly",
                f"Guaranteed zero memory consumption"
            ],
            "correct": 1,
            "expl_gen": lambda t, s, d: f"Uncontrolled side effects in {t} lead to subtle state mutation bugs, making distributed debugging and unit verification significantly harder."
        },
        {
            "template": "Which metric is most critical when measuring the real-world efficiency of {topic}?",
            "opt_gen": lambda t, s, d: [
                f"Total line count in the source repository",
                f"Number of comments written per function",
                f"Asymptotic growth rate (Big-O time and space complexity) and resource utilization",
                f"Font size used in the integrated development environment"
            ],
            "correct": 2,
            "expl_gen": lambda t, s, d: f"Systematic evaluation of {t} relies on asymptotic analysis (time and space bounds) coupled with practical hardware profiling."
        }
    ]

    questions = []
    for i in range(min(count, len(templates))):
        tmpl = templates[i]
        q_text = tmpl["template"].format(topic=clean_topic, subject=clean_subj, difficulty=difficulty)
        options = tmpl["opt_gen"](clean_topic, clean_subj, difficulty)
        explanation = tmpl["expl_gen"](clean_topic, clean_subj, difficulty)
        questions.append({
            "id": f"gen-{uuid.uuid4().hex[:6]}",
            "question": q_text,
            "options": options,
            "correctAnswer": tmpl["correct"],
            "explanation": explanation
        })

    return questions

def get_questions_for_subject(
    subject: str,
    topic: Optional[str] = None,
    difficulty: str = "Intermediate",
    count: int = 5
) -> Dict[str, Any]:
    """
    Main entry point for quiz generation on ANY arbitrary topic.
    1. If OpenAI or Gemini key is configured, invokes live LLM.
    2. If standard subject matches curated bank and topic is empty or matches, uses curated bank.
    3. If arbitrary new topic without API key, uses transparent offline generator clearly marked as Demo Fallback.
    """
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    resolved_topic = topic.strip() if topic and topic.strip() else subject.strip()

    # 1. Try Live AI if keys are present
    if openai_key:
        ai_questions = _generate_via_openai(subject, resolved_topic, difficulty, count, openai_key)
        if ai_questions:
            return {
                "id": f"quiz-{uuid.uuid4().hex[:8]}",
                "subject": subject,
                "topic": resolved_topic,
                "difficulty": difficulty,
                "mode": "ai_generated",
                "provider": "OpenAI (gpt-4o-mini)",
                "questions": ai_questions
            }

    if gemini_key:
        ai_questions = _generate_via_gemini(subject, resolved_topic, difficulty, count, gemini_key)
        if ai_questions:
            return {
                "id": f"quiz-{uuid.uuid4().hex[:8]}",
                "subject": subject,
                "topic": resolved_topic,
                "difficulty": difficulty,
                "mode": "ai_generated",
                "provider": "Google Gemini (gemini-1.5-flash)",
                "questions": ai_questions
            }

    # 2. Check if subject matches curated question bank
    subj_lower = subject.lower()
    matched_key = None
    for key in QUESTION_BANK:
        if key.lower() in subj_lower or subj_lower in key.lower() or ("algo" in subj_lower and "dsa" in key.lower()):
            # Only match curated bank if topic is either empty, same as subject, or appears in bank
            if not topic or topic.lower() == subject.lower() or any(w in topic.lower() for w in key.lower().split()):
                matched_key = key
                break

    if matched_key:
        bank_questions = QUESTION_BANK[matched_key][:min(count, len(QUESTION_BANK[matched_key]))]
        return {
            "id": f"quiz-{uuid.uuid4().hex[:8]}",
            "subject": matched_key,
            "topic": resolved_topic,
            "difficulty": difficulty,
            "mode": "curated_bank",
            "provider": "StudyMate Curated Question Bank",
            "questions": bank_questions
        }

    # 3. Arbitrary Topic Offline Generator (Demo Mode)
    fallback_questions = _generate_dynamic_fallback(subject, resolved_topic, difficulty, count)
    return {
        "id": f"quiz-{uuid.uuid4().hex[:8]}",
        "subject": subject,
        "topic": resolved_topic,
        "difficulty": difficulty,
        "mode": "demo_fallback",
        "provider": "StudyMate Offline Topic Generator (Demo Mode)",
        "notice": "Generated using StudyMate offline curriculum generator. Configure OPENAI_API_KEY or GEMINI_API_KEY in backend/.env for live LLM questions.",
        "questions": fallback_questions
    }
