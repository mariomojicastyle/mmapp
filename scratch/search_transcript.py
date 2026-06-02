import json
import re

log_file = r'C:\Users\mario\.gemini\antigravity\brain\ca62b16c-4dae-4a58-9339-4b615964e4f2\.system_generated\logs\transcript.jsonl'

with open(log_file, encoding='utf-8') as f:
    lines = f.readlines()

for line in lines:
    try:
        data = json.loads(line)
        if data.get('type') == 'PLANNER_RESPONSE':
            created = data.get('created_at', '')
            if '18:03:' in created or '18:15:' in created or '18:55:' in created:
                tools = data.get('tool_calls', [])
                for t in tools:
                    if t.get('name') in ['replace_file_content', 'write_to_file', 'multi_replace_file_content']:
                        print(f"--- [{created}] {t.get('name')} ---")
                        print(json.dumps(t.get('args', {}), indent=2)[:2000])
    except Exception as e:
        pass
