#!/usr/bin/env python
import os
import sys

# Ensure local pkgs directory is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
pkgs_dir = os.path.join(BASE_DIR, 'pkgs')
if os.path.exists(pkgs_dir) and pkgs_dir not in sys.path:
    sys.path.insert(0, pkgs_dir)

def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saarthi_backend.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django."
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
