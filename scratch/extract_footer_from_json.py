import json

json_path = r"c:\Desarrollo\mmapp\scratch\raw_footer_match.json"
print("Reading raw match JSON...")

with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# The data is a line from transcript_full.
print("Type of step:", data.get("type"))
print("Step index:", data.get("step_index"))

# Check for tool_calls or response contents
tool_calls = data.get("tool_calls", [])
for idx, tc in enumerate(tool_calls):
    print(f"Tool Call {idx}: {tc.get('name')}")
    args = tc.get("arguments", {})
    for key, val in args.items():
        if isinstance(val, str) and "Footer.tsx" in val:
            print(f"  Key: {key} targets Footer.tsx")
        if key == "CodeContent" or key == "ReplacementContent":
            print(f"  Found content for {key}:")
            print(val[:1500])
            with open(rf"c:\Desarrollo\mmapp\scratch\extracted_footer_{key}.tsx", "w", encoding="utf-8") as out:
                out.write(val)
        if key == "ReplacementChunks":
            print("  Found ReplacementChunks!")
            for c_idx, chunk in enumerate(val):
                print(f"    Chunk {c_idx}: target matches: {chunk.get('TargetContent')[:100]}...")
                print(f"    Replacement matches: {chunk.get('ReplacementContent')[:100]}...")
                with open(rf"c:\Desarrollo\mmapp\scratch\extracted_chunk_{c_idx}.tsx", "w", encoding="utf-8") as out:
                    out.write(chunk.get("ReplacementContent"))

# Check content
content = data.get("content", "")
if content:
    print("Found content in message:")
    print(content[:1500])
    with open(r"c:\Desarrollo\mmapp\scratch\extracted_content_msg.txt", "w", encoding="utf-8") as out:
        out.write(content)
