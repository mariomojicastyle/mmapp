import os
import json

brain_dir = r"C:\Users\mario\.gemini\antigravity\brain"
print("Scanning all transcripts for Footer.tsx and Logosimbolo.svg...")

for root, dirs, files in os.walk(brain_dir):
    for file in files:
        if file in ("transcript_full.jsonl", "transcript.jsonl"):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    for line in f:
                        if "Footer.tsx" in line and "Logosimbolo.svg" in line:
                            print(f"FOUND MATCH IN LINE: {filepath}")
                            # Let's write the matched line JSON to scratch to analyze it
                            with open(r"c:\Desarrollo\mmapp\scratch\raw_footer_match.json", "w", encoding="utf-8") as out:
                                out.write(line)
                            print("Saved raw line to raw_footer_match.json")
            except Exception as e:
                pass
print("Finished scanning.")
