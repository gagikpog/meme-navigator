import React from 'react';
import UploadForm from '../components/UploadForm';
import { useNavigate } from 'react-router-dom';

const MemeCreate = () => {
  const navigate = useNavigate();

  return (
    <div className="py-6">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4">Новый мем</h1>
        <UploadForm onUpload={() => navigate('/')} />
      </div>
    </div>
  );
};

export default MemeCreate;
