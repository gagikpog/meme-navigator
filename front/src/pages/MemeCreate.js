import React from 'react';
import UploadForm from '../components/UploadForm';
import { useNavigate } from 'react-router-dom';
import IconClose from '../icons/Close';

const MemeCreate = () => {
  const navigate = useNavigate();

  return (
    <div className="py-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className='flex justify-between items-center mb-2'>
          <h1 className="text-2xl font-bold mb-4">Новый мем</h1>
          <IconClose onClick={() => navigate(-1)} />
        </div>
        <UploadForm onUpload={() => navigate('/')} />
      </div>
    </div>
  );
};

export default MemeCreate;
