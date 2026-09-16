import os
import sys
import subprocess
import signal
import time
from pathlib import Path

def main():
    current_dir = Path(__file__).resolve().parent
    if (current_dir / "resolvegraph").exists():
        root_dir = current_dir
    else:
        root_dir = current_dir.parent

    resolvegraph_dir = root_dir / "resolvegraph"
    web_dir = resolvegraph_dir / "apps" / "web"
    venv_python = root_dir / "venv" / "Scripts" / "python.exe"

    python_exe = str(venv_python) if venv_python.exists() else sys.executable
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"

    print("=" * 65)
    print("🚀  Starting ResolveGraph (Backend + Frontend)")
    print("=" * 65)
    print(f"📦 Python:   {python_exe}")
    print(f"📁 Root Dir: {root_dir}")
    print(f"🌐 Web App:  {web_dir}")
    print("=" * 65)
    print("📍 Frontend:     http://localhost:3000")
    print("📍 Backend API:  http://127.0.0.1:8000")
    print("📍 Swagger Docs: http://127.0.0.1:8000/docs")
    print("=" * 65)
    print("Press Ctrl+C to stop both services.\n")

    env = os.environ.copy()
    env["PYTHONPATH"] = str(root_dir)

    # 1. Start FastAPI Backend
    backend_cmd = [
        python_exe,
        "-m",
        "uvicorn",
        "resolvegraph.apps.api.app.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8000",
        "--reload"
    ]
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=str(root_dir),
        env=env
    )

    # 2. Start Next.js Frontend
    frontend_cmd = [npm_cmd, "run", "dev"]
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=str(web_dir)
    )

    def cleanup(signum=None, frame=None):
        print("\n\n🛑 Shutting down ResolveGraph services...")
        for p in [backend_proc, frontend_proc]:
            try:
                if sys.platform == "win32":
                    subprocess.call(["taskkill", "/F", "/T", "/PID", str(p.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    p.terminate()
            except Exception:
                pass
        print("✓ All processes stopped.")
        sys.exit(0)

    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    try:
        while True:
            time.sleep(1)
            if backend_proc.poll() is not None or frontend_proc.poll() is not None:
                cleanup()
    except KeyboardInterrupt:
        cleanup()

if __name__ == "__main__":
    main()
