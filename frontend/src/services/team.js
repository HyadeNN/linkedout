import { db, auth } from '../firebase';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    arrayUnion, 
    arrayRemove, 
    query, 
    where,
    serverTimestamp 
} from 'firebase/firestore';

// Teams collection reference
const teamsRef = collection(db, 'teams');

// Create a new team
export const createTeam = async (teamData) => {
    try {
        const { name, description, members } = teamData;
        const currentUser = auth.currentUser;

        const teamDoc = await addDoc(teamsRef, {
            name,
            description,
            createdBy: currentUser.uid,
            createdAt: serverTimestamp(),
            members: [
                {
                    uid: currentUser.uid,
                    role: 'admin',
                    joinedAt: serverTimestamp()
                },
                ...members.map(member => ({
                    uid: member,
                    role: 'member',
                    joinedAt: serverTimestamp()
                }))
            ],
            updatedAt: serverTimestamp()
        });

        // Add team reference to all members' user documents
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
            teams: arrayUnion(teamDoc.id)
        });

        for (const memberId of members) {
            const memberRef = doc(db, 'users', memberId);
            await updateDoc(memberRef, {
                teams: arrayUnion(teamDoc.id)
            });
        }

        return teamDoc.id;
    } catch (error) {
        console.error('Error creating team:', error);
        throw error;
    }
};

// Get user's teams
export const getUserTeams = async () => {
    try {
        const currentUser = auth.currentUser;
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) return [];

        const userTeams = userDoc.data().teams || [];
        const teams = [];

        for (const teamId of userTeams) {
            const teamDoc = await getDoc(doc(db, 'teams', teamId));
            if (teamDoc.exists()) {
                const teamData = teamDoc.data();
                // Get member details
                const memberPromises = teamData.members.map(async (member) => {
                    const memberDoc = await getDoc(doc(db, 'users', member.uid));
                    return {
                        ...member,
                        name: memberDoc.data()?.name || '',
                        profile_image: memberDoc.data()?.profile?.profile_image || ''
                    };
                });
                const membersWithDetails = await Promise.all(memberPromises);
                
                teams.push({
                    id: teamDoc.id,
                    ...teamData,
                    members: membersWithDetails,
                    isAdmin: teamData.members.find(m => m.uid === currentUser.uid)?.role === 'admin'
                });
            }
        }

        return teams;
    } catch (error) {
        console.error('Error getting user teams:', error);
        throw error;
    }
};

// Leave team
export const leaveTeam = async (teamId) => {
    try {
        const currentUser = auth.currentUser;
        const teamRef = doc(db, 'teams', teamId);
        const teamDoc = await getDoc(teamRef);

        if (!teamDoc.exists()) throw new Error('Team not found');

        const teamData = teamDoc.data();
        const userRole = teamData.members.find(m => m.uid === currentUser.uid)?.role;

        if (userRole === 'admin' && teamData.members.length > 1) {
            // Transfer admin role to another member before leaving
            const newAdmin = teamData.members.find(m => m.uid !== currentUser.uid);
            if (newAdmin) {
                await updateDoc(teamRef, {
                    members: teamData.members.map(m => 
                        m.uid === newAdmin.uid 
                            ? { ...m, role: 'admin' }
                            : m.uid === currentUser.uid
                                ? null
                                : m
                    ).filter(Boolean)
                });
            }
        } else {
            // Remove user from team members
            await updateDoc(teamRef, {
                members: teamData.members.filter(m => m.uid !== currentUser.uid)
            });
        }

        // Remove team from user's teams
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
            teams: arrayRemove(teamId)
        });

        // If no members left, delete the team
        const updatedTeamDoc = await getDoc(teamRef);
        if (updatedTeamDoc.data().members.length === 0) {
            await deleteDoc(teamRef);
        }
    } catch (error) {
        console.error('Error leaving team:', error);
        throw error;
    }
};

// Add member to team
export const addTeamMember = async (teamId, memberId) => {
    try {
        const teamRef = doc(db, 'teams', teamId);
        const teamDoc = await getDoc(teamRef);

        if (!teamDoc.exists()) throw new Error('Team not found');

        // Add member to team
        await updateDoc(teamRef, {
            members: arrayUnion({
                uid: memberId,
                role: 'member',
                joinedAt: serverTimestamp()
            })
        });

        // Add team to member's teams
        const memberRef = doc(db, 'users', memberId);
        await updateDoc(memberRef, {
            teams: arrayUnion(teamId)
        });
    } catch (error) {
        console.error('Error adding team member:', error);
        throw error;
    }
};

// Remove member from team
export const removeTeamMember = async (teamId, memberId) => {
    try {
        const teamRef = doc(db, 'teams', teamId);
        const teamDoc = await getDoc(teamRef);

        if (!teamDoc.exists()) throw new Error('Team not found');

        const teamData = teamDoc.data();
        const memberToRemove = teamData.members.find(m => m.uid === memberId);

        if (!memberToRemove) throw new Error('Member not found in team');
        if (memberToRemove.role === 'admin') throw new Error('Cannot remove admin');

        // Remove member from team
        await updateDoc(teamRef, {
            members: teamData.members.filter(m => m.uid !== memberId)
        });

        // Remove team from member's teams
        const memberRef = doc(db, 'users', memberId);
        await updateDoc(memberRef, {
            teams: arrayRemove(teamId)
        });
    } catch (error) {
        console.error('Error removing team member:', error);
        throw error;
    }
};

// Update team
export const updateTeam = async (teamId, updateData) => {
    try {
        const teamRef = doc(db, 'teams', teamId);
        await updateDoc(teamRef, {
            ...updateData,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating team:', error);
        throw error;
    }
}; 