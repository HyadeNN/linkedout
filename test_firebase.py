from firebase_config import db

def test_connection():
    try:
        # Test verisi oluştur
        test_data = {
            'test': 'connection_test',
            'timestamp': firestore.SERVER_TIMESTAMP
        }
        
        # Test koleksiyonuna yaz
        db.collection('test').document('connection_test').set(test_data)
        print("Firebase bağlantısı başarılı!")
        
        # Test verisini oku
        doc = db.collection('test').document('connection_test').get()
        if doc.exists:
            print("Veri okuma başarılı!")
            print(f"Okunan veri: {doc.to_dict()}")
        
    except Exception as e:
        print(f"Bağlantı hatası: {str(e)}")

if __name__ == "__main__":
    test_connection() 