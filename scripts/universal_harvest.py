import os
import sys
import shutil
import re

def main():
    if len(sys.argv) < 3:
        print("Usage: python universal_harvest.py <donor_path> <vendor_name>")
        print("Example: python universal_harvest.py \"D:\\GITHUB RESPIRATORY\\NOOR\" noor-engine")
        sys.exit(1)

    donor_path = sys.argv[1]
    vendor_name = sys.argv[2]
    
    gs_food_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_path = os.path.join(gs_food_root, "vendor", vendor_name)
    
    if not os.path.exists(donor_path):
        print(f"ERROR: Donor path {donor_path} does not exist.")
        sys.exit(1)

    print(f"Initiating Harvesting Protocol: {vendor_name}")
    
    # 1. Recursive Copy while skipping large/binary directories
    harvested_cnt = 0
    for root, dirs, files in os.walk(donor_path):
        dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', 'dist', 'out', '__pycache__']]
        
        for file in files:
            source_file = os.path.join(root, file)
            rel_path = os.path.relpath(source_file, donor_path)
            dest_file = os.path.join(target_path, rel_path)
            
            os.makedirs(os.path.dirname(dest_file), exist_ok=True)
            
            if not os.path.exists(dest_file):
                shutil.copy2(source_file, dest_file)
                harvested_cnt += 1
                
    print(f"Harvested {harvested_cnt} files into vendor/{vendor_name}")

    # 2. Automated Harmonization - Enforce GS FOOD Single Source of Truth
    server_paths = [
        os.path.join(target_path, "src", "server.js"),
        os.path.join(target_path, "server.js"),
        os.path.join(target_path, "src", "app.js")
    ]
    
    for s_path in server_paths:
        if os.path.exists(s_path):
            with open(s_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Simple Harmonization: Strip Express GET/POST routes that bypass Typed InternalBridge
            print(f"Harmonizing Router Endpoints in {s_path}...")
            # We enforce GS FOOD supremacy by replacing raw /v1/infer routes dynamically if found.
            # This is a naive regex replacement for prototype purposes
            content = re.sub(
                r"if\s*\(\s*req\.method\s*===\s*'POST'\s*&&\s*req\.url\s*===\s*'/v1/infer'\s*\)\s*\{.*?(return;|\})\s*\}", 
                "/* BYPASS ROUTE SEVERED BY GS-FOOD UNIVERSAL HARVESTER */", 
                content, 
                flags=re.DOTALL
            )
            
            with open(s_path, 'w', encoding='utf-8') as f:
                f.write(content)

    config_paths = [
        os.path.join(target_path, "src", "config.js"),
        os.path.join(target_path, "config.js")
    ]
    
    for c_path in config_paths:
        if os.path.exists(c_path):
            with open(c_path, 'r', encoding='utf-8') as f:
                content = f.read()
            print(f"Enforcing Cybernetic OS Mode in {c_path}...")
            content = re.sub(
                r"process\.env\.[A-Z_]+_MODE", 
                "process.env.GSFOOD_ENGINE_MODE", 
                content
            )
            with open(c_path, 'w', encoding='utf-8') as f:
                f.write(content)

    print(f"SUCCESS: Donor {vendor_name} has been harvested, neutralized, and bound to the GS FOOD pipeline.")

if __name__ == "__main__":
    main()
