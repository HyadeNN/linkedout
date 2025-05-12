import firebase_admin
from firebase_admin import credentials, firestore
import os

# Firebase yapılandırması
cred = credentials.Certificate("linkedout-9c0c5-firebase-adminsdk-8j8qk-0c0c0c0c0c.json")

# Firebase uygulamasını başlat
try:
    firebase_admin.get_app()
except ValueError:
    firebase_admin.initialize_app(cred, {
        'projectId': 'linkedout-9c0c5',
        'storageBucket': 'linkedout-9c0c5.appspot.com'
    })

# Firestore veritabanı referansı
db = firestore.client()

# Offline persistence'ı etkinleştir
settings = firestore.Settings(
    persistence=True,
    cache_size_bytes=firestore.CACHE_SIZE_UNLIMITED
)
db.settings = settings

# Koleksiyon referansları
users_ref = db.collection('users')
posts_ref = db.collection('posts') 