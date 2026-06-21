#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import json
import urllib.request
import urllib.error

# Beautiful CLI Color coding definitions
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def test_ollama_status(target_url="http://localhost:11434"):
    print(f"\n{Colors.OKBLUE}[*] Diagnosing Local Ollama Network Node on: {target_url}...{Colors.ENDC}")
    try:
        # Request Ollama tags/models api list
        req = urllib.request.Request(f"{target_url}/api/tags", headers={'User-Agent': 'Alfred-Workspace-CLI'})
        with urllib.request.urlopen(req, timeout=1.8) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                models = data.get("models", [])
                print(f"{Colors.OKGREEN}[✓] OLLAMA NODE SENSOR: ONLINE & ACTIVE!{Colors.ENDC}")
                print(f"{Colors.OKCYAN}    Detected local models in library: {len(models)}{Colors.ENDC}")
                for idx, m in enumerate(models):
                    print(f"      [{idx + 1}] {Colors.BOLD}{m.get('name')}{Colors.ENDC} ({m.get('details', {}).get('parameter_size', 'unknown-parameter')})")
                return True
    except urllib.error.URLError as e:
        print(f"{Colors.WARNING}[!] Ollama node could not be probed on {target_url} (Reason: {e.reason}){Colors.ENDC}")
    except Exception as e:
        print(f"{Colors.WARNING}[!] Connection failed: {str(e)}{Colors.ENDC}")
    
    print(f"{Colors.FAIL}[-] Local Ollama target unreachable.{Colors.ENDC}")
    print(f"    {Colors.BOLD}How to fix / launch:{Colors.ENDC}")
    print("    1. Install Ollama from: https://ollama.com")
    print("    2. Open your terminal and run a model (e.g. 'ollama run llama3.2')")
    print("    3. Ensure Alfred is running. Node queries will automatically proxy to bypass CORS restrictions!")
    return False

def show_helper_instructions():
    print(f"\n{Colors.HEADER}=== ALFRED LINUX AI WORKSTATION PYTHON SHELL DRIVER ==={Colors.ENDC}")
    print("This file is fully configured as an executable pipeline.")
    print(f"Run permissions can be added with: {Colors.OKBLUE}chmod +x run.py{Colors.ENDC}")
    print("\nAvailable routines inside this executable module:")
    print(f"  {Colors.BOLD}1. run.py status{Colors.ENDC}    - Tests local Ollama network link status and logs libraries.")
    print(f"  {Colors.BOLD}2. run.py test{Colors.ENDC}      - Runs Python sandbox validation.")
    print(f"  {Colors.BOLD}3. run.py install{Colors.ENDC}   - Automatically installs requirements from requirements.txt.")
    
def run_sandbox_validation():
    print(f"\n{Colors.OKBLUE}[*] Booting Sandbox validation script...{Colors.ENDC}")
    try:
        from main import compile_matrix
        compile_matrix()
        print(f"{Colors.OKGREEN}[✓] Validation simulation complete with code 0!{Colors.ENDC}")
    except ImportError:
        print(f"{Colors.FAIL}[-] Main.py file import failed. Ensure you are running in the correct directory.{Colors.ENDC}")

def install_requirements():
    print(f"\n{Colors.OKCYAN}[*] Attempting to install requirements from requirements.txt...{Colors.ENDC}")
    req_path = os.path.join(os.path.dirname(__file__), "requirements.txt")
    if os.path.exists(req_path):
        os.system(f"{sys.executable} -m pip install -r {req_path}")
    else:
        print(f"{Colors.FAIL}[-] requirements.txt not found here.{Colors.ENDC}")

if __name__ == '__main__':
    args = sys.argv[1:]
    if not args:
        show_helper_instructions()
        test_ollama_status()
    elif "status" in args:
        test_ollama_status()
    elif "test" in args:
        run_sandbox_validation()
    elif "install" in args:
        install_requirements()
    else:
        show_helper_instructions()
