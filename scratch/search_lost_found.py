import os

lost_found_dir = r"c:\Desarrollo\mmapp\.git\lost-found\other"
print("Scanning lost-found directory for Logosimbolo.svg...")

if os.path.exists(lost_found_dir):
    files = os.listdir(lost_found_dir)
    for f in files:
        filepath = os.path.join(lost_found_dir, f)
        try:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as file:
                content = file.read()
                if "Logosimbolo.svg" in content or "Logosimbolo" in content:
                    print(f"MATCH FOUND: {f} (size: {len(content)})")
                    print(content[:800])
                    print("=" * 60)
                    with open(rf"c:\Desarrollo\mmapp\scratch\found_logosimbolo_{f}.tsx", "w", encoding="utf-8") as out:
                        out.write(content)
        except Exception as e:
            pass
else:
    print("lost-found directory does not exist.")
