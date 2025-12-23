import { useNavigate, useParams } from 'react-router-dom';
import { useGetSpecimenQuery } from '../../../store/api/specimenApi';

export const useSpecimenDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useGetSpecimenQuery(id!, { skip: !id });

  const handleBack = () => {
    navigate('/specimens');
  };

  const handleEdit = () => {
    navigate(`/specimen/edit/${id}`);
  };

  return {
    id,
    data,
    isLoading,
    error,
    handleBack,
    handleEdit,
  };
};
