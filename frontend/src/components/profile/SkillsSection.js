import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import './SkillsSection.css';

const SkillsSection = () => {
  const { currentUser } = useAuth();
  const [skills, setSkills] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkills = async () => {
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSkills(docSnap.data().skills || []);
        }
        setLoading(false);
      }
    };
    fetchSkills();
  }, [currentUser]);

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;

    const updatedSkills = [...skills, { id: Date.now(), name: newSkill.trim() }];
    setSkills(updatedSkills);
    await updateDoc(doc(db, 'users', currentUser.uid), {
      skills: updatedSkills
    });
    setNewSkill('');
    setIsEditing(false);
  };

  const handleDeleteSkill = async (skillId) => {
    const updatedSkills = skills.filter(skill => skill.id !== skillId);
    setSkills(updatedSkills);
    await updateDoc(doc(db, 'users', currentUser.uid), {
      skills: updatedSkills
    });
  };

  if (loading) {
    return <div className="skills-section-loading">Loading...</div>;
  }

  return (
    <div className="skills-section">
      <div className="section-header">
        <h2>Skills</h2>
        {!isEditing && (
          <button className="add-button" onClick={() => setIsEditing(true)}>
            Add Skills
          </button>
        )}
      </div>

      {isEditing && (
        <div className="skills-form">
          <input
            type="text"
            placeholder="Add a skill"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddSkill();
              }
            }}
          />
          <div className="form-actions">
            <button className="save-button" onClick={handleAddSkill}>
              Save
            </button>
            <button className="cancel-button" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="skills-list">
        {skills.map((skill) => (
          <div key={skill.id} className="skill-item">
            <span className="skill-name">{skill.name}</span>
            <button
              className="delete-button"
              onClick={() => handleDeleteSkill(skill.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillsSection;
