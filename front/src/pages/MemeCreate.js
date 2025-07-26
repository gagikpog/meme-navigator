import React from 'react';
import UploadForm from '../components/UploadForm';
import { useNavigate } from 'react-router-dom';

const MemeCreate = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Новый мем</h1>
      <UploadForm onUpload={() => navigate('/')} />
    </div>
  );
};

export default MemeCreate;
