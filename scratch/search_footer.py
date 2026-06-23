import os
import json

brain_dir = r"C:\Users\mario\.gemini\antigravity\brain"
print("Scanning all transcripts for Footer contents...")

out_path = r"c:\Desarrollo\mmapp\scratch\footer_raw_matches.txt"
with open(out_path, "w", encoding="utf-8") as out:
    count = 0
    for root, dirs, files in os.walk(brain_dir):
        for file in files:
            if file in ("transcript_full.jsonl", "transcript.jsonl"):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        for line in f:
                            if "Footer.tsx" in line and ("CodeContent" in line or "ReplacementContent" in line):
                                count += 1
                                out.write(f"=== MATCH {count} in {filepath} ===\n")
                                out.write(line[:2000] + "\n\n") # Print first 2000 chars of the line
                except Exception as e:
                    pass

print(f"Scan complete. Saved {count} raw matches to footer_raw_matches.txt.")
