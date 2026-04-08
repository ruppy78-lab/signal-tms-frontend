import { useMemo } from 'react';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidUUID = (id) => !!id && UUID_RE.test(id);

export const useFormId = (id) => {
  return useMemo(() => ({
    id,
    isNew: !isValidUUID(id),
    isEdit: isValidUUID(id),
    isValid: isValidUUID(id),
  }), [id]);
};
