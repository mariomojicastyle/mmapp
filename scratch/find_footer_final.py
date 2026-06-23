import os
import json

brain_dir = r"C:\Users\mario\.gemini\antigravity\brain"
print("Scanning all transcripts for Footer.tsx edits...")

edit_count = 0
for root, dirs, files in os.walk(brain_dir):
    for file in files:
        if file == "transcript_full.jsonl":
            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    for line in f:
                        if "Footer.tsx" in line:
                            try:
                                data = json.loads(line)
                                for tc in data.get("tool_calls", []):
                                    args = tc.get("arguments", {})
                                    target = args.get("TargetFile", "")
                                    if "Footer.tsx" in target:
                                        edit_count += 1
                                        print(f"Edit {edit_count} | file: {file} | Step: {data.get('step_index')}")
                                        # Save the arguments of this tool call to a file
                                        out_name = f"c:\\Desarrollo\\mmapp\\scratch\\edit_footer_{edit_count}_step_{data.get('step_index')}.json"
                                        with open(out_name, "w", encoding="utf-8") as out:
                                            json.dump(args, out, indent=2)
                                        print(f"  Saved tool call args to {out_name}")
                            except Exception as e:
                                pass
            except Exception as e:
                pass
print(f"Scan complete. Total edits saved: {edit_count}")
