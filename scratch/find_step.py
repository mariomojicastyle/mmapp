import json

log_path = r"C:\Users\mario\.gemini\antigravity\brain\bfe75400-11b8-4856-be9c-be8f6a664f7d\.system_generated\logs\transcript.jsonl"

steps = []
with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            step_idx = data.get("step_index")
            step_type = data.get("type")
            content = data.get("content", "")
            if step_idx is not None and 270 <= step_idx <= 336:
                steps.append((step_idx, step_type, len(content), content[:50]))
        except Exception as e:
            pass

print(f"Total steps found: {len(steps)}")
for s in steps:
    print(f"Step {s[0]} ({s[1]}): length {s[2]} - {s[3]}")
