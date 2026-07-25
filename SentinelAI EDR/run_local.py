#!/usr/bin/env python3
import os
import sys
import subprocess
import threading
import time
import shutil

# ANSI Color Escape Codes
C_ORCH = "36"  # Cyan
C_BACK = "35"  # Magenta
C_FRONT = "34"  # Blue
C_AGNT = "33"  # Yellow
C_SUCC = "32"  # Green
C_ERR  = "31"  # Red

def print_orch(msg, color=C_ORCH):
    print(f"\033[{color}m[ORCHESTRATOR]\033[0m {msg}")

def print_banner():
    banner = f"""
\033[{C_SUCC}m======================================================================
     SentinelAI EDR - Complete Offline Local Environment Orchestrator
======================================================================\033[0m
    """
    print(banner)

def check_requirements():
    print_orch("Checking local system prerequisites...")
    
    # 1. Check Python version
    py_ver = sys.version_info
    print_orch(f"Python version: {py_ver.major}.{py_ver.minor}.{py_ver.micro} (Found)")
    if py_ver.major < 3 or (py_ver.major == 3 and py_ver.minor < 8):
        print_orch("WARNING: Python 3.8+ is recommended.", C_ERR)

    # 2. Check Node.js / npm
    npm_path = shutil.which("npm")
    if not npm_path:
        print_orch("CRITICAL ERROR: Node.js and npm are not installed or not in PATH.", C_ERR)
        print_orch("Next.js frontend console requires Node.js (v20+ recommended).", C_ERR)
        sys.exit(1)
    else:
        try:
            npm_ver = subprocess.check_output(["npm", "--version"], shell=True).decode().strip()
            print_orch(f"npm version: {npm_ver} (Found at {npm_path})")
        except Exception:
            print_orch("npm found but version check failed. Proceeding anyway...", C_AGNT)

def setup_venv(project_root):
    venv_dir = os.path.join(project_root, ".venv")
    print_orch(f"Checking Python virtual environment in: {venv_dir}")
    
    if not os.path.exists(venv_dir):
        print_orch("Virtual environment not found. Creating a new one...")
        try:
            subprocess.check_call([sys.executable, "-m", "venv", ".venv"])
            print_orch("Virtual environment created successfully.", C_SUCC)
        except Exception as e:
            print_orch(f"Failed to create virtual environment: {e}", C_ERR)
            print_orch("Please run 'python -m venv .venv' manually in the project root.", C_ERR)
            sys.exit(1)
    else:
        print_orch("Existing virtual environment found.")

    # Determine paths based on platform
    if os.name == "nt":
        venv_python = os.path.join(venv_dir, "Scripts", "python.exe")
        venv_pip = os.path.join(venv_dir, "Scripts", "pip.exe")
    else:
        venv_python = os.path.join(venv_dir, "bin", "python")
        venv_pip = os.path.join(venv_dir, "bin", "pip")

    # Double check executables exist
    if not os.path.exists(venv_python) or not os.path.exists(venv_pip):
        print_orch("Virtual environment appears corrupted. Re-creating...", C_AGNT)
        shutil.rmtree(venv_dir, ignore_errors=True)
        subprocess.check_call([sys.executable, "-m", "venv", ".venv"])

    return venv_python, venv_pip

def install_dependencies(venv_pip):
    print_orch("Installing backend Python dependencies (skipping PostgreSQL drivers for SQLite compatibility)...")
    try:
        req_path = "backend/requirements.txt"
        temp_req_path = "backend/requirements_local.txt"
        with open(req_path, "r") as f:
            lines = f.readlines()
        
        # Strip psycopg2-binary and asyncpg as they are not needed for SQLite and fail on Python 3.14 without binary wheels.
        # Also convert == to >= for pydantic and pydantic-settings to allow pip to find newer prebuilt wheels on modern Python versions (like Python 3.14).
        filtered_lines = []
        for line in lines:
            if "psycopg2-binary" in line or "asyncpg" in line:
                continue
            if "pydantic==" in line:
                line = line.replace("pydantic==", "pydantic>=")
            if "pydantic-settings==" in line:
                line = line.replace("pydantic-settings==", "pydantic-settings>=")
            if "sqlalchemy==" in line:
                line = line.replace("sqlalchemy==", "sqlalchemy>=")
            if "fastapi==" in line:
                line = line.replace("fastapi==", "fastapi>=")
            if "uvicorn==" in line:
                line = line.replace("uvicorn==", "uvicorn>=")
            filtered_lines.append(line)
        
        with open(temp_req_path, "w") as f:
            f.writelines(filtered_lines)
            
        subprocess.check_call([venv_pip, "install", "--upgrade", "-r", temp_req_path])
        
        # Install email-validator required by newer Pydantic versions for EmailStr fields
        subprocess.check_call([venv_pip, "install", "email-validator"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        try:
            os.remove(temp_req_path)
        except Exception:
            pass
            
        print_orch("Backend Python packages installed successfully.", C_SUCC)
    except Exception as e:
        print_orch(f"Failed to install backend packages: {e}", C_ERR)
        sys.exit(1)

    print_orch("Installing EDR Agent Python dependencies...")
    try:
        subprocess.check_call([venv_pip, "install", "-r", "agent/requirements.txt"])
        print_orch("Agent Python packages installed successfully.", C_SUCC)
    except Exception as e:
        print_orch(f"Failed to install agent packages: {e}", C_ERR)
        sys.exit(1)

    print_orch("Installing frontend Node.js dependencies (this may take a minute)...")
    try:
        # run npm install in frontend with legacy peer deps fallback
        subprocess.check_call(["npm", "install", "--legacy-peer-deps"], cwd="frontend", shell=True)
        print_orch("Frontend Node.js packages installed successfully.", C_SUCC)
    except Exception as e:
        print_orch(f"Failed to install frontend node modules: {e}", C_ERR)
        sys.exit(1)

def initialize_database(venv_python):
    print_orch("Initializing and seeding local SQLite database...")
    try:
        env = os.environ.copy()
        env["DATABASE_URL"] = "sqlite:///./sentinel_edr.db"
        # Run db_init as a module inside the backend directory to resolve relative imports
        subprocess.check_call([venv_python, "-m", "app.db_init"], cwd="backend", env=env)
        print_orch("SQLite database seeded successfully.", C_SUCC)
    except Exception as e:
        print_orch(f"Database seeding failed: {e}", C_ERR)
        sys.exit(1)

def log_stream(proc_name, stream, color_code):
    try:
        for line in iter(stream.readline, b''):
            decoded = line.decode('utf-8', errors='replace').rstrip()
            print(f"\033[{color_code}m[{proc_name}]\033[0m {decoded}")
    except Exception as e:
        print(f"\033[{C_ERR}m[{proc_name} Stream Error]\033[0m {e}")

def start_stream_threads(proc, proc_name, color_code):
    stdout_thread = threading.Thread(
        target=log_stream, 
        args=(proc_name, proc.stdout, color_code), 
        daemon=True
    )
    stderr_thread = threading.Thread(
        target=log_stream, 
        args=(proc_name, proc.stderr, color_code), 
        daemon=True
    )
    stdout_thread.start()
    stderr_thread.start()

def terminate_process(proc, name):
    if not proc or proc.poll() is not None:
        return
    print_orch(f"Stopping {name}...")
    try:
        if os.name == "nt":
            # Windows process tree termination
            subprocess.call(["taskkill", "/F", "/T", "/PID", str(proc.pid)], 
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            proc.terminate()
            proc.wait(timeout=3)
    except Exception as e:
        print_orch(f"Error terminating {name}: {e}", C_ERR)
        try:
            proc.kill()
        except Exception:
            pass

def main():
    print_banner()
    project_root = os.path.dirname(os.path.abspath(__file__))
    
    # 1. Verification
    check_requirements()
    
    # 2. Setup Venv
    venv_python, venv_pip = setup_venv(project_root)
    
    # 3. Dependencies
    install_dependencies(venv_pip)
    
    # 4. DB Init
    initialize_database(venv_python)
    
    # 5. Launch Processes Concurrently
    processes = []
    
    # Define env vars for FastAPI Backend
    backend_env = os.environ.copy()
    backend_env["DATABASE_URL"] = "sqlite:///./sentinel_edr.db"
    backend_env["JWT_SECRET"] = "sentinel_jwt_secret_key_2026_super_secure"
    backend_env["OPENAI_API_KEY"] = "mock-key"
    backend_env["OPENAI_API_BASE"] = "http://127.0.0.1:8000/api/v1/ai/mock"
    
    print_orch("Launching FastAPI Backend service...", C_SUCC)
    backend_proc = subprocess.Popen(
        [venv_python, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd="backend",
        env=backend_env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    start_stream_threads(backend_proc, "BACKEND", C_BACK)
    processes.append((backend_proc, "Backend"))
    
    # Define env vars for Next.js Frontend
    frontend_env = os.environ.copy()
    frontend_env["NEXT_PUBLIC_API_URL"] = "http://localhost:8000"
    
    print_orch("Launching Next.js SOC Console...", C_SUCC)
    frontend_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd="frontend",
        env=frontend_env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        shell=True
    )
    start_stream_threads(frontend_proc, "FRONTEND", C_FRONT)
    processes.append((frontend_proc, "Frontend"))
    
    # Launch EDR Agent Simulator
    print_orch("Launching Sentinel EDR Agent Simulator...", C_SUCC)
    agent_proc = subprocess.Popen(
        [
            venv_python, "sentinel_agent.py", 
            "--backend", "http://127.0.0.1:8000", 
            "--interval", "5", 
            "--simulate-malware", 
            "--simulate-network", 
            "--simulate-keylogger"
        ],
        cwd="agent",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    start_stream_threads(agent_proc, "AGENT", C_AGNT)
    processes.append((agent_proc, "Agent"))
    
    # 6. Monitor
    print_orch("======================================================================", C_SUCC)
    print_orch(" All services started successfully!", C_SUCC)
    print_orch(" Access points:", C_SUCC)
    print_orch("  * SOC Dashboard Console: \033[4mhttp://localhost:3000\033[0m", C_SUCC)
    print_orch("  * Swagger API Documentation: \033[4mhttp://localhost:8000/docs\033[0m", C_SUCC)
    print_orch(" Default Credentials:", C_SUCC)
    print_orch("  * Email: admin@sentinelai.local", C_SUCC)
    print_orch("  * Password: SentinelAdmin2026!", C_SUCC)
    print_orch(" Press Ctrl+C to stop all services cleanly.", C_AGNT)
    print_orch("======================================================================", C_SUCC)
    
    try:
        while True:
            time.sleep(1)
            # Check if any process exited
            for proc, name in processes:
                exit_code = proc.poll()
                if exit_code is not None:
                    print_orch(f"Process {name} exited with status {exit_code}.", C_ERR)
                    raise KeyboardInterrupt
    except KeyboardInterrupt:
        print("")
        print_orch("Keyboard interrupt received. Cleaning up processes...", C_AGNT)
    finally:
        for proc, name in processes:
            terminate_process(proc, name)
        print_orch("Shutdown completed.", C_SUCC)

if __name__ == "__main__":
    main()
