import { supabase } from './supabaseClient';

export const getVerificationStatus = async (userId) => {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('kyc')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error && error.code !== 'PGRST116') throw error;
    
    return data || { status: 'unverified', verification_skipped: false };
  } catch (error) {
    console.error('Error fetching verification status:', error);
    return { status: 'unverified', verification_skipped: false };
  }
};

export const isVerified = async (userId) => {
  const status = await getVerificationStatus(userId);
  return status?.status === 'approved';
};
