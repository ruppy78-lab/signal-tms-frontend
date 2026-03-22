import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import toast from 'react-hot-toast';

export const useCrud = (queryKey, endpoint) => {
  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: ({ id, body }) =>
      id ? api.put(`${endpoint}/${id}`, body) : api.post(endpoint, body),
    onSuccess: (_, vars) => {
      toast.success(vars.id ? 'Updated successfully' : 'Created successfully');
      qc.invalidateQueries([queryKey]);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  });

  const remove = useMutation({
    mutationFn: (id) => api.delete(`${endpoint}/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries([queryKey]); },
    onError: (e) => toast.error(e.response?.data?.message || 'Delete failed'),
  });

  return { save, remove };
};
