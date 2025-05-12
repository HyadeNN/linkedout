import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import './EducationSection.css';

const EducationSection = () => {
  const { currentUser } = useAuth();
  const [educations, setEducations] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newEducation, setNewEducation] = useState({
    school: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEducations = async () => {
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEducations(docSnap.data().educations || []);
        }
        setLoading(false);
      }
    };
    fetchEducations();
  }, [currentUser]);

  const handleAddEducation = async () => {
    if (!newEducation.school || !newEducation.degree) return;

    const updatedEducations = [...educations, { ...newEducation, id: Date.now() }];
    setEducations(updatedEducations);
    await updateDoc(doc(db, 'users', currentUser.uid), {
      educations: updatedEducations
    });
    setNewEducation({
      school: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      description: ''
    });
    setIsEditing(false);
  };

  const handleDeleteEducation = async (educationId) => {
    const updatedEducations = educations.filter(edu => edu.id !== educationId);
    setEducations(updatedEducations);
    await updateDoc(doc(db, 'users', currentUser.uid), {
      educations: updatedEducations
    });
  };

  if (loading) {
    return <div className="education-section-loading">Loading...</div>;
  }

  return (
    <div className="education-section">
      <div className="section-header">
        <h2>Education</h2>
        {!isEditing && (
          <button className="add-button" onClick={() => setIsEditing(true)}>
            Add Education
          </button>
        )}
      </div>

      {isEditing && (
        <div className="education-form">
          <input
            type="text"
            placeholder="School"
            value={newEducation.school}
            onChange={(e) => setNewEducation({ ...newEducation, school: e.target.value })}
          />
          <input
            type="text"
            placeholder="Degree"
            value={newEducation.degree}
            onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
          />
          <input
            type="text"
            placeholder="Field of Study"
            value={newEducation.field}
            onChange={(e) => setNewEducation({ ...newEducation, field: e.target.value })}
          />
          <div className="date-inputs">
            <input
              type="date"
              placeholder="Start Date"
              value={newEducation.startDate}
              onChange={(e) => setNewEducation({ ...newEducation, startDate: e.target.value })}
            />
            <input
              type="date"
              placeholder="End Date"
              value={newEducation.endDate}
              onChange={(e) => setNewEducation({ ...newEducation, endDate: e.target.value })}
            />
          </div>
          <textarea
            placeholder="Description"
            value={newEducation.description}
            onChange={(e) => setNewEducation({ ...newEducation, description: e.target.value })}
          />
          <div className="form-actions">
            <button className="save-button" onClick={handleAddEducation}>
              Save
            </button>
            <button className="cancel-button" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="educations-list">
        {educations.map((education) => (
          <div key={education.id} className="education-item">
            <div className="education-header">
              <h3>{education.school}</h3>
              <button
                className="delete-button"
                onClick={() => handleDeleteEducation(education.id)}
              >
                Delete
              </button>
            </div>
            <p className="degree">{education.degree}</p>
            <p className="field">{education.field}</p>
            <p className="date">
              {education.startDate} - {education.endDate || 'Present'}
            </p>
            <p className="description">{education.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EducationSection;
