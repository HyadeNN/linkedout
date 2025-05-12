import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import './ExperienceSection.css';

const ExperienceSection = () => {
  const { currentUser } = useAuth();
  const [experiences, setExperiences] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newExperience, setNewExperience] = useState({
    title: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExperiences = async () => {
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setExperiences(docSnap.data().experiences || []);
        }
        setLoading(false);
      }
    };
    fetchExperiences();
  }, [currentUser]);

  const handleAddExperience = async () => {
    if (!newExperience.title || !newExperience.company) return;

    const updatedExperiences = [...experiences, { ...newExperience, id: Date.now() }];
    setExperiences(updatedExperiences);
    await updateDoc(doc(db, 'users', currentUser.uid), {
      experiences: updatedExperiences
    });
    setNewExperience({
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      description: ''
    });
    setIsEditing(false);
  };

  const handleDeleteExperience = async (experienceId) => {
    const updatedExperiences = experiences.filter(exp => exp.id !== experienceId);
    setExperiences(updatedExperiences);
    await updateDoc(doc(db, 'users', currentUser.uid), {
      experiences: updatedExperiences
    });
  };

  if (loading) {
    return <div className="experience-section-loading">Loading...</div>;
  }

  return (
    <div className="experience-section">
      <div className="section-header">
        <h2>Experience</h2>
        {!isEditing && (
          <button className="add-button" onClick={() => setIsEditing(true)}>
            Add Experience
          </button>
        )}
      </div>

      {isEditing && (
        <div className="experience-form">
          <input
            type="text"
            placeholder="Title"
            value={newExperience.title}
            onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
          />
          <input
            type="text"
            placeholder="Company"
            value={newExperience.company}
            onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
          />
          <input
            type="text"
            placeholder="Location"
            value={newExperience.location}
            onChange={(e) => setNewExperience({ ...newExperience, location: e.target.value })}
          />
          <div className="date-inputs">
            <input
              type="date"
              placeholder="Start Date"
              value={newExperience.startDate}
              onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
            />
            <input
              type="date"
              placeholder="End Date"
              value={newExperience.endDate}
              onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
            />
          </div>
          <textarea
            placeholder="Description"
            value={newExperience.description}
            onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
          />
          <div className="form-actions">
            <button className="save-button" onClick={handleAddExperience}>
              Save
            </button>
            <button className="cancel-button" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="experiences-list">
        {experiences.map((experience) => (
          <div key={experience.id} className="experience-item">
            <div className="experience-header">
              <h3>{experience.title}</h3>
              <button
                className="delete-button"
                onClick={() => handleDeleteExperience(experience.id)}
              >
                Delete
              </button>
            </div>
            <p className="company">{experience.company}</p>
            <p className="location">{experience.location}</p>
            <p className="date">
              {experience.startDate} - {experience.endDate || 'Present'}
            </p>
            <p className="description">{experience.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExperienceSection;
