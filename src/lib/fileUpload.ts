import { supabase } from '@/integrations/supabase/client';

export const uploadAttachment = async (file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `attachments/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('feedback-attachments')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('feedback-attachments')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadAttachment:', error);
    return null;
  }
};
