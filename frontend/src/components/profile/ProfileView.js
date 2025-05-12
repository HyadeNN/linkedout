import React from 'react';
import ProfileHeader from './ProfileHeader';
import ExperienceSection from './ExperienceSection';
import EducationSection from './EducationSection';
import SkillsSection from './SkillsSection';

const ProfileView = () => {
  return (
    <div className="profile-view">
      <ProfileHeader />
      <div className="profile-sections">
        <ExperienceSection />
        <EducationSection />
        <SkillsSection />
      </div>
    </div>
  );
};

export default ProfileView;
