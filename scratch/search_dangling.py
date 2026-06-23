import subprocess

print("Extracting dangling blobs...")
result = subprocess.run(["git", "fsck", "--lost-found"], capture_output=True, text=True)
blobs = []
for line in result.stdout.splitlines():
    if "dangling blob" in line:
        blob_sha = line.split()[-1]
        blobs.append(blob_sha)

print(f"Found {len(blobs)} dangling blobs.")

for sha in blobs:
    res = subprocess.run(["git", "cat-file", "-p", sha], capture_output=True, text=True, errors='ignore')
    content = res.stdout
    if "export default function Footer" in content or 't("Términos de Servicio"' in content or 't("Política de Privacidad"' in content or "t('Términos de Servicio'" in content:
        print(f"MATCH FOUND: blob {sha}")
        # write to scratch
        filename = f"c:\\Desarrollo\\mmapp\\scratch\\recovered_footer_{sha[:6]}.tsx"
        with open(filename, "w", encoding="utf-8") as out:
            out.write(content)
        print("Saved to", filename)

print("Done.")
