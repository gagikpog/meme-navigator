import React from 'react';
import UploadForm from '../components/UploadForm';
import { useNavigate } from 'react-router-dom';
import IconClose from '../icons/Close';
import useSmartBack from '../hooks/useSmartBack';

const MemeCreate = () => {
  const navigate = useNavigate();
  const smartBack = useSmartBack();

  return (
    <div className="py-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className='flex justify-between items-center mb-2'>
          <h1 className="text-2xl font-bold mb-4">Новый мем</h1>
          <IconClose onClick={() => smartBack()} />
        </div>
        <UploadForm onUpload={() => navigate('/')} />
      </div>
    </div>
  );
};

export default MemeCreate;
