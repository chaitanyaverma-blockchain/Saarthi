import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
pkgs_dir = os.path.join(BASE_DIR, 'pkgs')
if os.path.exists(pkgs_dir) and pkgs_dir not in sys.path:
    sys.path.insert(0, pkgs_dir)

from django.core.wsgi import get_wsgi_application
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saarthi_backend.settings')
application = get_wsgi_application()
