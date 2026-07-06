import os
import sys
import subprocess
import time
import signal

def run_command_in_dir(cmd, directory, shell=False):
    print(f"[PhishGuard Local] Executing: {' '.join(cmd) if isinstance(cmd, list) else cmd} in {directory}")
    process = subprocess.Popen(
        cmd,
        cwd=directory,
        shell=shell
    )
    return process

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")

    print("====================================================")
    # 1. Check/Install Backend Dependencies
    print("[PhishGuard Local] Step 1: Checking Python backend dependencies...")
    try:
        # Install packages directly using the current python environment
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
            cwd=backend_dir,
            check=True
        )
        print("[PhishGuard Local] Backend dependencies installed/verified.")
    except Exception as e:
        print(f"[Warning] Failed to auto-install backend dependencies: {e}")
        print("Please ensure pip is configured correctly.")

    print("====================================================")
    # 2. Check/Install Frontend Dependencies
    print("[PhishGuard Local] Step 2: Checking Node.js frontend dependencies...")
    node_modules_path = os.path.join(frontend_dir, "node_modules")
    if not os.path.exists(node_modules_path):
        print("[PhishGuard Local] node_modules not found. Executing 'npm install'...")
        try:
            subprocess.run(
                ["npm", "install"],
                cwd=frontend_dir,
                shell=True,
                check=True
            )
            print("[PhishGuard Local] Frontend dependencies installed successfully.")
        except Exception as e:
            print(f"[Error] Frontend installation failed: {e}")
            print("Please ensure Node.js (npm) is installed on your system.")
            sys.exit(1)
    else:
        print("[PhishGuard Local] node_modules already exists. Skipping npm install.")

    print("====================================================")
    # 3. Spawn Backend Server
    print("[PhishGuard Local] Step 3: Starting FastAPI backend on http://127.0.0.1:8000 ...")
    backend_cmd = [
        sys.executable, "-m", "uvicorn", 
        "app.main:app", 
        "--host", "127.0.0.1", 
        "--port", "8000", 
        "--reload"
    ]
    backend_process = run_command_in_dir(backend_cmd, backend_dir)

    # 4. Spawn Frontend Server
    print("[PhishGuard Local] Step 4: Starting Next.js frontend on http://localhost:3000 ...")
    frontend_process = run_command_in_dir(["npm", "run", "dev"], frontend_dir, shell=True)

    print("====================================================")
    print("[PhishGuard Local] Platform is running! Press Ctrl+C to terminate both servers.")
    print("====================================================")

    # Keep script alive and relay logs
    try:
        # Configure non-blocking reads or basic loop to keep running
        while True:
            # Check if either process died
            if backend_process.poll() is not None:
                print(f"[Error] Backend process terminated unexpectedly with code {backend_process.returncode}")
                break
            if frontend_process.poll() is not None:
                print(f"[Error] Frontend process terminated unexpectedly with code {frontend_process.returncode}")
                break
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[PhishGuard Local] Terminating servers. Please wait...")
    finally:
        # Gracefully kill backend and frontend subprocesses
        try:
            if os.name == 'nt':
                # Windows taskkill to ensure sub-processes spawned by shells are terminated
                subprocess.run(["taskkill", "/F", "/T", "/PID", str(backend_process.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                subprocess.run(["taskkill", "/F", "/T", "/PID", str(frontend_process.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                backend_process.terminate()
                frontend_process.terminate()
        except Exception:
            pass
        print("[PhishGuard Local] Servers stopped successfully.")

if __name__ == "__main__":
    main()
