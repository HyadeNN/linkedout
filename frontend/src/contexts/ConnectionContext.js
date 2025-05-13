import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';

const ConnectionContext = createContext();

export const useConnection = () => {
    return useContext(ConnectionContext);
};

export const ConnectionProvider = ({ children }) => {
    const [connectionCount, setConnectionCount] = useState(0);
    const [connections, setConnections] = useState([]);

    useEffect(() => {
        let unsubscribe;

        const setupConnectionListener = async () => {
            if (!auth.currentUser) return;

            const userRef = doc(db, 'users', auth.currentUser.uid);
            
            // Set up real-time listener
            unsubscribe = onSnapshot(userRef, (doc) => {
                if (doc.exists()) {
                    const userConnections = doc.data().connections || [];
                    setConnectionCount(userConnections.length);
                    setConnections(userConnections);
                }
            }, (error) => {
                console.error('Error listening to connections:', error);
            });
        };

        setupConnectionListener();

        // Cleanup listener on unmount
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [auth.currentUser]);

    const updateConnectionCount = async () => {
        if (!auth.currentUser) return;

        try {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const userConnections = userDoc.data().connections || [];
                setConnectionCount(userConnections.length);
                setConnections(userConnections);
            }
        } catch (error) {
            console.error('Error fetching connection count:', error);
        }
    };

    const value = {
        connectionCount,
        connections,
        updateConnectionCount,
        setConnectionCount,
        setConnections
    };

    return (
        <ConnectionContext.Provider value={value}>
            {children}
        </ConnectionContext.Provider>
    );
};

export default ConnectionContext; 