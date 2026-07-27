import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAddSagaDialog } from '@/components/AddSagaDialog';

export default function AddSaga() {
  const navigate = useNavigate();
  const { open } = useAddSagaDialog();

  useEffect(() => {
    open();
    // replace history so user won't see this route if they close the dialog
    navigate('/', { replace: true });
  }, [open, navigate]);

  return null;
}
