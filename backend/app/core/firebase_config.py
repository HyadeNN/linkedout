import firebase_admin
from firebase_admin import credentials, auth
from pathlib import Path

# Initialize Firebase Admin SDK
cred = credentials.Certificate(
    str(Path(__file__).parent.parent.parent / "firebase-credentials.json")
)
firebase_admin.initialize_app(cred)

def verify_firebase_token(token: str) -> dict:
    """
    Verify the Firebase ID token and return the decoded token
    """
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise Exception(f"Invalid token: {str(e)}") 