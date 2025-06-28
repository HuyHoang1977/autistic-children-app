import React from 'react';
import ProfileForm from '../../components/forms/ProfileForm';

const ProfilePage: React.FC = () => {
  const handleSuccess = () => {
    console.log('Profile updated successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="container mx-auto">
        <ProfileForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
};

export default ProfilePage;
