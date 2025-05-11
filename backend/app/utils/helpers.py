import os
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
import re
from fastapi import UploadFile, HTTPException
from PIL import Image
import io

from app.config import settings


def slugify(text: str) -> str:
    """Create a slug from a text."""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text


def save_upload_file(file: UploadFile, folder: str) -> str:
    """Save an uploaded file and return the file path."""
    if not file:
        return None

    # Create the folder if it doesn't exist
    upload_dir = os.path.join(settings.UPLOADS_DIR, folder)
    os.makedirs(upload_dir, exist_ok=True)

    # Generate a unique filename
    filename = f"{uuid.uuid4()}_{datetime.now().strftime('%Y%m%d%H%M%S')}"

    # Get the file extension
    content_type = file.content_type
    if content_type == "image/jpeg":
        ext = ".jpg"
    elif content_type == "image/png":
        ext = ".png"
    elif content_type == "image/gif":
        ext = ".gif"
    else:
        ext = os.path.splitext(file.filename)[1]

    # Create the full file path
    file_path = os.path.join(upload_dir, f"{filename}{ext}")

    # Save the file
    with open(file_path, "wb") as f:
        f.write(file.file.read())

    # Return the path relative to the UPLOADS_DIR
    return f"{folder}/{filename}{ext}"


def save_image_with_resize(
        file: UploadFile,
        folder: str,
        max_width: Optional[int] = 1200,
        max_height: Optional[int] = 1200,
        quality: int = 85
) -> str:
    """Save an image file with resizing and return the file path."""
    if not file:
        return None

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File is not an image")

    # Read the image
    contents = file.file.read()
    file.file.seek(0)  # Reset file pointer

    try:
        img = Image.open(io.BytesIO(contents))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # Resize the image if needed
    width, height = img.size
    if max_width and max_height and (width > max_width or height > max_height):
        # Calculate new dimensions while preserving aspect ratio
        ratio = min(max_width / width, max_height / height)
        new_width = int(width * ratio)
        new_height = int(height * ratio)
        img = img.resize((new_width, new_height), Image.LANCZOS)

    # Create the folder if it doesn't exist
    upload_dir = os.path.join(settings.UPLOADS_DIR, folder)
    os.makedirs(upload_dir, exist_ok=True)

    # Generate a unique filename
    filename = f"{uuid.uuid4()}_{datetime.now().strftime('%Y%m%d%H%M%S')}"

    # Get the file extension
    content_type = file.content_type
    if content_type == "image/jpeg":
        ext = ".jpg"
        save_format = "JPEG"
    elif content_type == "image/png":
        ext = ".png"
        save_format = "PNG"
    elif content_type == "image/gif":
        ext = ".gif"
        save_format = "GIF"
    else:
        ext = ".jpg"
        save_format = "JPEG"

    # Create the full file path
    file_path = os.path.join(upload_dir, f"{filename}{ext}")

    # Save the image
    img.save(file_path, format=save_format, quality=quality)

    # Return the path relative to the UPLOADS_DIR
    return f"{folder}/{filename}{ext}"


def delete_file(file_path: str) -> bool:
    """Delete a file from the uploads directory."""
    full_path = os.path.join(settings.UPLOADS_DIR, file_path)
    if os.path.exists(full_path):
        os.remove(full_path)
        return True
    return False


def get_file_url(file_path: str) -> str:
    """Convert a file path to a URL."""
    if not file_path:
        return None
    return f"{settings.MEDIA_URL}{file_path}"


def paginate_response(
        items: List[Any],
        page: int,
        limit: int,
        total: int,
        additional_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Create a paginated response."""
    total_pages = (total + limit - 1) // limit

    response = {
        "items": items,
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1
    }

    if additional_data:
        response.update(additional_data)

    return response