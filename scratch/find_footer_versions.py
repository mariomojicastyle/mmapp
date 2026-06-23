import os
import json

brain_dir = r"C:\Users\mario\.gemini\antigravity\brain"
print("Scanning transcripts for Footer versions...")

version_count = 0
for root, dirs, files in os.walk(brain_dir):
    for file in files:
        if file == "transcript_full.jsonl":
            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    for line in f:
                        if "Footer.tsx" in line and "export default function Footer" in line:
                            try:
                                data = json.loads(line)
                                for tc in data.get("tool_calls", []):
                                    args = tc.get("arguments", {})
                                    code = args.get("CodeContent") or args.get("ReplacementContent")
                                    if code and "export default function Footer" in code:
                                        version_count += 1
                                        out_name = f"c:\\Desarrollo\\mmapp\\scratch\\version_footer_{version_count}_{filepath.split(os.sep)[-4]}.tsx"
                                        with open(out_name, "w", encoding="utf-8") as out:
                                            out.write(code)
                                        print(f"Version {version_count} saved from {filepath} to {out_name}")
                            except Exception as e:
                                pass
            except Exception as e:
                pass
print(f"Scan complete. Total versions saved: {version_count}")
