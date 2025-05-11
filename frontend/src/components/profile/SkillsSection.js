import React, { useState } from 'react';
import { profileService } from '../../services';

const SkillsSection = ({
  skills = [],
  isEditable = false,
  canEndorse = false,
  onUpdate = () => {}
}) => {
  const [newSkill, setNewSkill] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [endorsingSkillId, setEndorsingSkillId] = useState(null);

  const handleAddClick = () => {
    setIsAdding(true);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewSkill('');
  };

  const handleNewSkillChange = (e) => {
    setNewSkill(e.target.value);
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();

    if (!newSkill.trim()) {
      return;
    }

    try {
      setLoading(true);
      await profileService.createSkill({ name: newSkill.trim() });
      setNewSkill('');
      setIsAdding(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to add skill:', error);
      if (error.response && error.response.data && error.response.data.detail === 'Skill already exists for this profile') {
        alert('This skill is already in your profile.');
      } else {
        alert('Failed to add skill. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm('Are you sure you want to delete this skill?')) {
      return;
    }

    try {
      setLoading(true);
      await profileService.deleteSkill(skillId);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete skill:', error);
      alert('Failed to delete skill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEndorseSkill = async (skillId) => {
    try {
      setEndorsingSkillId(skillId);
      await profileService.endorseSkill(skillId);
      onUpdate();
    } catch (error) {
      console.error('Failed to endorse skill:', error);
      if (error.response && error.response.data && error.response.data.detail === 'Skill already endorsed by this user') {
        alert('You have already endorsed this skill.');
      } else if (error.response && error.response.data && error.response.data.detail === 'Cannot endorse your own skill') {
        alert('You cannot endorse your own skill.');
      } else {
        alert('Failed to endorse skill. Please try again.');
      }
    } finally {
      setEndorsingSkillId(null);
    }
  };

  return (
    <div className="skills-section">
      <div className="section-header">
        <h2 className="section-title">Skills</h2>
        {isEditable && !isAdding && (
          <button
            className="add-item-btn"
            onClick={handleAddClick}
            disabled={loading}
          >
            <span className="add-icon">+</span>
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAddSkill} className="add-skill-form">
          <div className="form-group">
            <input
              type="text"
              value={newSkill}
              onChange={handleNewSkillChange}
              placeholder="Add a skill"
              disabled={loading}
              autoFocus
            />
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={handleCancelAdd}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-btn"
              disabled={loading || !newSkill.trim()}
            >
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      )}

      {skills.length === 0 && !isAdding ? (
        <div className="empty-section">
          <p>Add your skills</p>
          {isEditable && (
            <button
              className="add-skill-btn"
              onClick={handleAddClick}
              disabled={loading}
            >
              Add skill
            </button>
          )}
        </div>
      ) : (
        <div className="skills-list">
          {skills.map(skill => (
            <div key={skill.id} className="skill-item">
              <div className="skill-info">
                <span className="skill-name">{skill.name}</span>
                {skill.endorsement_count > 0 && (
                  <span className="endorsement-count">
                    {skill.endorsement_count} endorsement{skill.endorsement_count !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="skill-actions">
                {canEndorse && (
                  <button
                    className="endorse-btn"
                    onClick={() => handleEndorseSkill(skill.id)}
                    disabled={endorsingSkillId === skill.id}
                  >
                    {endorsingSkillId === skill.id ? 'Endorsing...' : 'Endorse'}
                  </button>
                )}

                {isEditable && (
                  <button
                    className="delete-item-btn"
                    onClick={() => handleDeleteSkill(skill.id)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillsSection;